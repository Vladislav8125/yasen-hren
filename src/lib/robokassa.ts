import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createSubscriptionCommission } from "@/lib/partners";
import type { Tariff } from "@/generated/prisma/client";

const PAYMENT_URL = "https://auth.robokassa.ru/Merchant/Index.aspx";
const RECURRING_URL = "https://auth.robokassa.ru/Merchant/Recurring";
const TARIFF_PRICES: Record<Exclude<Tariff, "FREE">, number> = { STANDARD: 590, PREMIUM: 3500 };
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

type RobokassaConfig = { login: string; password1: string; password2: string; algorithm: "md5" | "sha256" | "sha512"; isTest: boolean };

function config(): RobokassaConfig {
  const login = process.env.ROBOKASSA_MERCHANT_LOGIN;
  const password1 = process.env.ROBOKASSA_PASSWORD_1;
  const password2 = process.env.ROBOKASSA_PASSWORD_2;
  const algorithm = (process.env.ROBOKASSA_HASH_ALGORITHM ?? "md5").toLowerCase();
  if (!login || !password1 || !password2) throw new Error("Robokassa не настроена: заполните ROBOKASSA_MERCHANT_LOGIN, ROBOKASSA_PASSWORD_1 и ROBOKASSA_PASSWORD_2.");
  if (algorithm !== "md5" && algorithm !== "sha256" && algorithm !== "sha512") throw new Error("ROBOKASSA_HASH_ALGORITHM должен быть md5, sha256 или sha512.");
  return { login, password1, password2, algorithm, isTest: process.env.ROBOKASSA_IS_TEST === "true" };
}

/** Оплата включается только после заполнения всех серверных ключей Робокассы. */
export function isRobokassaConfigured() {
  return Boolean(
    process.env.ROBOKASSA_MERCHANT_LOGIN &&
      process.env.ROBOKASSA_PASSWORD_1 &&
      process.env.ROBOKASSA_PASSWORD_2,
  );
}

function invoiceId() { return `${Date.now()}${randomInt(100, 1000)}`; }
function hash(value: string, cfg: RobokassaConfig) { return createHash(cfg.algorithm).update(value, "utf8").digest("hex").toUpperCase(); }
function shp(entries: Iterable<[string, string]>) { return Array.from(entries).filter(([key]) => key.startsWith("Shp_")).sort(([a], [b]) => a.localeCompare(b, "en")).map(([key, value]) => `${key}=${value}`); }
function safeEqual(a: string, b: string) { const left = Buffer.from(a.toUpperCase()); const right = Buffer.from(b.toUpperCase()); return left.length === right.length && timingSafeEqual(left, right); }
function paymentSignature(cfg: RobokassaConfig, outSum: string, invId: string, custom: string[]) { return hash([cfg.login, outSum, invId, cfg.password1, ...custom].join(":"), cfg); }
function resultSignature(cfg: RobokassaConfig, outSum: string, invId: string, custom: string[]) { return hash([outSum, invId, cfg.password2, ...custom].join(":"), cfg); }
function addPeriod(from: Date) { return new Date(from.getTime() + PERIOD_MS); }

export async function createRobokassaPayment(params: { userId: string; tariff: Tariff }) {
  if (params.tariff === "FREE") throw new Error("Бесплатный тариф не требует оплаты.");
  const cfg = config();
  const invoice = invoiceId();
  const amount = TARIFF_PRICES[params.tariff];
  const outSum = amount.toFixed(2);
  const custom = [["Shp_user", params.userId], ["Shp_tariff", params.tariff], ["Shp_kind", "subscription"]] as [string, string][];
  await prisma.payment.create({ data: { userId: params.userId, tariff: params.tariff, amount: amount * 100, status: "pending", provider: "ROBOKASSA", robokassaInvoiceId: invoice, recurring: true } });
  const query = new URLSearchParams({ MerchantLogin: cfg.login, OutSum: outSum, InvoiceID: invoice, Description: `Ясен Хрен — тариф ${params.tariff}`, SignatureValue: paymentSignature(cfg, outSum, invoice, shp(custom)), Recurring: "true", Culture: "ru", ...Object.fromEntries(custom) });
  if (cfg.isTest) query.set("IsTest", "1");
  return `${PAYMENT_URL}?${query.toString()}`;
}

export async function applyRobokassaResult(params: URLSearchParams) {
  const outSum = params.get("OutSum") ?? "";
  const invoice = params.get("InvId") ?? params.get("InvoiceID") ?? "";
  const signature = params.get("SignatureValue") ?? "";
  const payment = invoice ? await prisma.payment.findUnique({ where: { robokassaInvoiceId: invoice } }) : null;
  if (!payment || payment.provider !== "ROBOKASSA" || !safeEqual(resultSignature(config(), outSum, invoice, shp(params.entries())), signature)) return { accepted: false as const, invoiceId: invoice };
  if (Math.round(Number(outSum) * 100) !== payment.amount) return { accepted: false as const, invoiceId: invoice };
  if (payment.status === "succeeded") return { accepted: true as const, invoiceId: invoice, applied: false };

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUniqueOrThrow({ where: { id: payment.userId }, select: { tariffExpiresAt: true } });
    const periodStart = currentUser.tariffExpiresAt && currentUser.tariffExpiresAt > now ? currentUser.tariffExpiresAt : now;
    const nextChargeAt = addPeriod(periodStart);
    await tx.payment.update({ where: { id: payment.id }, data: { status: "succeeded", paidAt: now } });
    await tx.user.update({ where: { id: payment.userId }, data: { tariff: payment.tariff, tariffExpiresAt: nextChargeAt } });
    if (payment.recurring) {
      const initialInvoiceId = payment.robokassaParentInvoiceId ?? payment.robokassaInvoiceId!;
      await tx.subscription.upsert({ where: { userId: payment.userId }, create: { userId: payment.userId, provider: "ROBOKASSA", tariff: payment.tariff, initialInvoiceId, lastInvoiceId: invoice, lastPaymentAt: now, nextChargeAt }, update: { provider: "ROBOKASSA", tariff: payment.tariff, status: "ACTIVE", initialInvoiceId, lastInvoiceId: invoice, lastPaymentAt: now, nextChargeAt, cancelAtPeriodEnd: false, cancelRequestedAt: null, canceledAt: null, reminderSentFor: null } });
    }
  });
  await createSubscriptionCommission(payment.id);
  return { accepted: true as const, invoiceId: invoice, applied: true };
}

export async function cancelRobokassaAutoRenewal(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || subscription.provider !== "ROBOKASSA") return false;
  await prisma.subscription.update({ where: { userId }, data: { status: "CANCEL_AT_PERIOD_END", cancelAtPeriodEnd: true, cancelRequestedAt: new Date() } });
  return true;
}

export async function resumeRobokassaAutoRenewal(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || subscription.provider !== "ROBOKASSA" || subscription.nextChargeAt <= new Date()) return false;
  await prisma.subscription.update({ where: { userId }, data: { status: "ACTIVE", cancelAtPeriodEnd: false, cancelRequestedAt: null, reminderSentFor: null } });
  return true;
}

export async function processDueRobokassaRenewals() {
  try {
    const cfg = config();
    const due = await prisma.subscription.findMany({ where: { provider: "ROBOKASSA", status: "ACTIVE", cancelAtPeriodEnd: false, nextChargeAt: { lte: new Date() } } });
    let created = 0;
    for (const subscription of due) {
      if (subscription.tariff === "FREE") {
        console.error("[robokassa] free tariff cannot be renewed", { subscriptionId: subscription.id });
        continue;
      }
      const existing = await prisma.payment.findFirst({ where: { provider: "ROBOKASSA", status: "pending", robokassaParentInvoiceId: subscription.initialInvoiceId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
      if (existing) continue;
      const id = invoiceId();
      const amount = TARIFF_PRICES[subscription.tariff as Exclude<Tariff, "FREE">];
      const outSum = amount.toFixed(2);
      const custom = [["Shp_user", subscription.userId], ["Shp_tariff", subscription.tariff], ["Shp_kind", "renewal"]] as [string, string][];
      const payment = await prisma.payment.create({ data: { userId: subscription.userId, tariff: subscription.tariff, amount: amount * 100, status: "pending", provider: "ROBOKASSA", robokassaInvoiceId: id, robokassaParentInvoiceId: subscription.initialInvoiceId, recurring: true } });
      const body = new URLSearchParams({ MerchantLogin: cfg.login, OutSum: outSum, InvoiceID: id, PreviousInvoiceID: subscription.initialInvoiceId, Description: `Ясен Хрен — продление ${subscription.tariff}`, SignatureValue: paymentSignature(cfg, outSum, id, shp(custom)), ...Object.fromEntries(custom) });
      if (cfg.isTest) body.set("IsTest", "1");
      const response = await fetch(RECURRING_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const responseText = await response.text();
      if (!response.ok || responseText.trim() !== `OK+${id}`) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "canceled" } });
        console.error("[robokassa] recurring request rejected", { invoiceId: id, status: response.status, response: responseText.slice(0, 200) });
        continue;
      }
      created++;
    }
    return { total: due.length, created };
  } catch (error) {
    console.error("[robokassa] renewal scheduler skipped", error);
    return { total: 0, created: 0 };
  }
}
