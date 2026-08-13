"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ShopProductId } from "@/generated/prisma/client";
import { resolvePartner, setAttribution } from "@/lib/partners";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function orderProduct(formData: FormData) {
  const user = await requireUser();
  const product = formData.get("product") as ShopProductId;
  const promoCode = String(formData.get("promoCode") ?? "");
  const partner = await resolvePartner(promoCode);
  if (partner) await setAttribution({ userId: user.id, partnerId: partner.id, source: "promo" });

  await prisma.shopOrder.create({ data: { userId: user.id, product } });

  revalidatePath("/shop");
}

export async function bookPsychologist(formData: FormData) {
  const user = await requireUser();
  const psychologistId = formData.get("psychologistId") as string;
  const promoCode = String(formData.get("promoCode") ?? "");
  const partner = await resolvePartner(promoCode);
  if (partner) await setAttribution({ userId: user.id, partnerId: partner.id, source: "promo" });

  await prisma.shopOrder.create({
    data: { userId: user.id, product: "CONSULTATION", psychologistId },
  });

  revalidatePath("/shop/consultation");
}
