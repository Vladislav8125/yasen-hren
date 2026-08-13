"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { codeFromText } from "@/lib/partners";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function becomePartner(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const requested = codeFromText(String(formData.get("code") ?? ""));
  if (requested.length < 3) throw new Error("Введите код из трёх и более букв или цифр");
  const promo = codeFromText(String(formData.get("promoCode") ?? requested));
  if (promo.length < 3) throw new Error("Промокод должен содержать минимум три символа");
  await prisma.partner.create({ data: { userId: session.user.id, code: requested, promoCode: promo } });
  revalidatePath("/partner");
}

export async function savePayoutDetails(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const payoutDetails = String(formData.get("payoutDetails") ?? "").trim().slice(0, 1000);
  await prisma.partner.update({ where: { userId: session.user.id }, data: { payoutDetails: payoutDetails || null } });
  revalidatePath("/partner");
}
