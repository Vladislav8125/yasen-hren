import { prisma } from "@/lib/prisma";
import type { CommissionKind, ShopProductId } from "@/generated/prisma/client";

export const REFERRAL_LIFETIME_DAYS = 90;
export const PAYOUT_MINIMUM_KOPECKS = 200_000; // 2 000 ₽

const SHOP_COMMISSION: Record<ShopProductId, { kind: CommissionKind; rateBps: number; priceRub: number }> = {
  CARDS: { kind: "CARDS", rateBps: 2000, priceRub: 10_000 },
  CONSULTATION: { kind: "CONSULTATION", rateBps: 2000, priceRub: 8_000 },
  FOUNDER: { kind: "CONSULTATION", rateBps: 2000, priceRub: 15_000 },
  GAME: { kind: "GAME", rateBps: 1000, priceRub: 150_000 },
  CORPORATE: { kind: "GAME", rateBps: 1000, priceRub: 100_000 },
  MERCH: { kind: "MERCH", rateBps: 1000, priceRub: 3_000 },
  CHALLENGE: { kind: "SUBSCRIPTION", rateBps: 2000, priceRub: 10_000 },
};

export function commissionForShopProduct(product: ShopProductId) {
  return SHOP_COMMISSION[product];
}

export function codeFromText(value: string) {
  return value.trim().toUpperCase().replace(/[^A-ZА-ЯЁ0-9_-]/g, "").slice(0, 32);
}

/** Код ссылки используется только в маршруте /r/[code]. */
export async function resolveLinkPartner(code: string) {
  const normalized = codeFromText(code);
  if (!normalized) return null;
  return prisma.partner.findFirst({ where: { status: "ACTIVE", code: normalized } });
}

/** Ручной ввод принимает только настоящий промокод, а не URL-код партнёра. */
export async function resolvePromoPartner(code: string) {
  const normalized = codeFromText(code);
  if (!normalized) return null;
  return prisma.partner.findFirst({ where: { status: "ACTIVE", promoCode: normalized } });
}

export async function setAttribution(params: { userId: string; partnerId: string; source: "link" | "promo" }) {
  const now = new Date();
  const partner = await prisma.partner.findUnique({ where: { id: params.partnerId }, select: { userId: true, status: true } });
  // Саморефералы и отключённые партнёры не атрибутируются.
  if (!partner || partner.status !== "ACTIVE" || partner.userId === params.userId) return null;
  const existing = await prisma.referralAttribution.findUnique({ where: { userId: params.userId } });
  // Явно введённый промокод сильнее любой последующей ссылки, пока он действует.
  if (params.source === "link" && existing?.source === "promo" && existing.expiresAt > now) return existing;
  const expiresAt = new Date(now.getTime() + REFERRAL_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  return prisma.referralAttribution.upsert({
    where: { userId: params.userId },
    create: { userId: params.userId, partnerId: params.partnerId, source: params.source, expiresAt, lastClickAt: now },
    update: { partnerId: params.partnerId, source: params.source, expiresAt, lastClickAt: now },
  });
}

async function activeAttribution(userId: string) {
  return prisma.referralAttribution.findFirst({
    where: { userId, expiresAt: { gt: new Date() }, partner: { status: "ACTIVE" } },
    include: { partner: true },
  });
}

export async function createSubscriptionCommission(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.paidAt) return null;
  // 90 дней — срок привязки до первой оплаты. После первой оплаты подписки
  // партнёр получает 20% с неё весь первый год, даже если cookie уже истекла.
  const firstSubscription = await prisma.referralCommission.findFirst({
    where: { customerId: payment.userId, kind: "SUBSCRIPTION", status: { not: "VOID" } },
    include: { payment: true },
    orderBy: { createdAt: "asc" },
  });
  const attribution = firstSubscription ? null : await activeAttribution(payment.userId);
  if (!firstSubscription && !attribution) return null;

  const firstPaymentAt = firstSubscription?.payment?.paidAt ?? payment.paidAt;
  const firstYearEnds = new Date(firstPaymentAt);
  firstYearEnds.setFullYear(firstYearEnds.getFullYear() + 1);
  if (payment.paidAt > firstYearEnds) return null;

  return prisma.referralCommission.upsert({
    where: { paymentId },
    create: {
      partnerId: firstSubscription?.partnerId ?? attribution!.partnerId, customerId: payment.userId, paymentId,
      kind: "SUBSCRIPTION", baseAmount: payment.amount, rateBps: 2000,
      amount: Math.round((payment.amount * 2000) / 10_000),
      attributionSource: firstSubscription?.attributionSource ?? attribution!.source,
    },
    update: {},
  });
}

export async function createShopCommission(shopOrderId: string) {
  const order = await prisma.shopOrder.findUnique({ where: { id: shopOrderId } });
  if (!order) return null;
  const attribution = await activeAttribution(order.userId);
  if (!attribution) return null;
  const rule = commissionForShopProduct(order.product);
  const baseAmount = order.amount ?? rule.priceRub * 100;
  const amount = Math.round((baseAmount * rule.rateBps) / 10_000);
  const existing = await prisma.referralCommission.findUnique({ where: { shopOrderId } });
  if (existing?.status === "PAID") return existing;
  return prisma.referralCommission.upsert({
    where: { shopOrderId },
    create: {
      partnerId: attribution.partnerId, customerId: order.userId, shopOrderId,
      kind: rule.kind, baseAmount, rateBps: rule.rateBps,
      amount, attributionSource: attribution.source,
    },
    // Пока выплата не проведена, менеджер может скорректировать фактическую
    // цену заказа — комиссия должна пересчитаться из неё.
    update: { baseAmount, amount, rateBps: rule.rateBps, kind: rule.kind, attributionSource: attribution.source, status: "APPROVED", paidAt: null },
  });
}

export async function voidShopCommission(shopOrderId: string) {
  return prisma.referralCommission.updateMany({
    where: { shopOrderId, status: "APPROVED" },
    data: { status: "VOID" },
  });
}
