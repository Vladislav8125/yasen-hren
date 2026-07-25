import { NextResponse } from "next/server";
import { applySuccessfulPayment } from "@/lib/yookassa";

// ЮKassa шлёт событие payment.succeeded — тело запроса НЕ подписано и
// теоретически может быть подделано, поэтому не доверяем ему напрямую:
// перепроверяем реальный статус платежа через API ЮKassa по id
// (см. src/lib/yookassa.ts, applySuccessfulPayment).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const paymentId = body?.object?.id as string | undefined;

  if (!paymentId) {
    return NextResponse.json({ error: "missing payment id" }, { status: 400 });
  }

  const result = await applySuccessfulPayment(paymentId);
  return NextResponse.json(result);
}
