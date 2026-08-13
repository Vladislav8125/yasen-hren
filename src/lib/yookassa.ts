import { prisma } from "@/lib/prisma";
import type { Tariff } from "@/generated/prisma/client";
import { createSubscriptionCommission } from "@/lib/partners";

// ЮKassa — архитектурное ТЗ, раздел 8. Паттерн переиспользован из
// plans/2026-07-04-yookassa-tripvayer-oplata.md (create-payment + webhook,
// вебхук перепроверяет статус через API, а не доверяет телу вслепую).
//
// Блокер: реальных ключей ещё нет (магазин не зарегистрирован — решение
// владельца). Код полностью готов и заработает, как только в .env появятся
// YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY — сначала в тестовом режиме ЮKassa.

const TARIFF_PRICES: Record<Exclude<Tariff, "FREE">, number> = {
  STANDARD: 590,
  PREMIUM: 3500,
};

function yookassaAuthHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new Error(
      "YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы — оплата пока недоступна (ключей ещё нет, см. .env.example).",
    );
  }
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export async function createYookassaPayment(params: { userId: string; tariff: Tariff }) {
  if (params.tariff === "FREE") {
    throw new Error("Free-тариф не требует оплаты");
  }

  const amountRub = TARIFF_PRICES[params.tariff];
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      tariff: params.tariff,
      amount: amountRub * 100, // в копейках
      status: "pending",
    },
  });

  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: yookassaAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": payment.id,
    },
    body: JSON.stringify({
      amount: { value: amountRub.toFixed(2), currency: "RUB" },
      confirmation: { type: "redirect", return_url: `${appUrl}/profile` },
      capture: true,
      description: `Ясен Хрен — тариф ${params.tariff}`,
      metadata: { paymentId: payment.id, userId: params.userId, tariff: params.tariff },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ЮKassa create-payment failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    id: string;
    confirmation: { confirmation_url: string };
  };

  await prisma.payment.update({
    where: { id: payment.id },
    data: { yookassaPaymentId: data.id },
  });

  return data.confirmation.confirmation_url;
}

/** Перепроверяет статус платежа напрямую в ЮKassa по id — не доверяем телу вебхука вслепую. */
export async function fetchYookassaPaymentStatus(yookassaPaymentId: string) {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${yookassaPaymentId}`, {
    headers: { Authorization: yookassaAuthHeader() },
  });
  if (!response.ok) {
    throw new Error(`ЮKassa get-payment failed: ${response.status}`);
  }
  return (await response.json()) as { id: string; status: string; metadata?: Record<string, string> };
}

const TARIFF_DURATION_DAYS = 30;

export async function applySuccessfulPayment(yookassaPaymentId: string) {
  const remote = await fetchYookassaPaymentStatus(yookassaPaymentId);
  if (remote.status !== "succeeded") return { applied: false, status: remote.status };

  const payment = await prisma.payment.findUnique({ where: { yookassaPaymentId } });
  if (!payment) return { applied: false, status: "unknown-payment" };
  if (payment.status === "succeeded") return { applied: false, status: "already-applied" };

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "succeeded", paidAt: new Date() },
  });

  await prisma.user.update({
    where: { id: payment.userId },
    data: {
      tariff: payment.tariff,
      tariffExpiresAt: new Date(Date.now() + TARIFF_DURATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await createSubscriptionCommission(payment.id);

  return { applied: true, status: "succeeded" };
}
