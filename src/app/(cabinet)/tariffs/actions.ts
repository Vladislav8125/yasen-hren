"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createYookassaPayment } from "@/lib/yookassa";
import type { Tariff } from "@/generated/prisma/client";
import { resolvePartner, setAttribution } from "@/lib/partners";

export async function subscribeToTariff(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tariff = formData.get("tariff") as Tariff;
  const promoCode = String(formData.get("promoCode") ?? "");
  const partner = await resolvePartner(promoCode);
  if (partner) await setAttribution({ userId: session.user.id, partnerId: partner.id, source: "promo" });
  const confirmationUrl = await createYookassaPayment({ userId: session.user.id, tariff });

  redirect(confirmationUrl);
}
