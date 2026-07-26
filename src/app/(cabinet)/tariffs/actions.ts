"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createYookassaPayment } from "@/lib/yookassa";
import type { Tariff } from "@/generated/prisma/client";

export async function subscribeToTariff(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tariff = formData.get("tariff") as Tariff;
  const confirmationUrl = await createYookassaPayment({ userId: session.user.id, tariff });

  redirect(confirmationUrl);
}
