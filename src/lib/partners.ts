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

/** Promocode is deliberately resolved before link attribution. */
export async function resolvePartner(code: string) {
  const normalized = codeFromText(code);
  if (!normalized) return null;
  return prisma.partner.findFirst({
    where: { status: "ACTIVE", OR: [{ code: normalized }, { promoCode: normalized }] },
  });
}

export async function setAttribution(params: { userId: string; partnerId: string; source: "link" | "promo" }) {
  const now = new Date();
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
  const attribution = await activeAttribution(payment.userId);
  if (!attribution) return null;

  // 20% applies only for the first year after the most recent attribution.
  const firstYearEnds = new Date(attribution.createdAt);
  firstYearEnds.setFullYear(firstYearEnds.getFullYear() + 1);
  if (payment.paidAt > firstYearEnds) return null;

  return prisma.referralCommission.upsert({
    where: { paymentId },
    create: {
      partnerId: attribution.partnerId, customerId: payment.userId, paymentId,
      kind: "SUBSCRIPTION", baseAmount: payment.amount, rateBps: 2000,
      amount: Math.round((payment.amount * 2000) / 10_000),
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
  const baseAmount = rule.priceRub * 100;
  return prisma.referralCommission.upsert({
    where: { shopOrderId },
    create: {
      partnerId: attribution.partnerId, customerId: order.userId, shopOrderId,
      kind: rule.kind, baseAmount, rateBps: rule.rateBps,
      amount: Math.round((baseAmount * rule.rateBps) / 10_000),
    },
    update: {},
  });
}
