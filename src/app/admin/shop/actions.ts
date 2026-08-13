"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ShopOrderStatus } from "@/generated/prisma/client";
import { createShopCommission, voidShopCommission } from "@/lib/partners";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN") redirect("/today");
  return user;
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as ShopOrderStatus;
  const amountRub = Number(formData.get("amountRub"));
  const amount = Number.isFinite(amountRub) && amountRub >= 0 ? Math.round(amountRub * 100) : undefined;

  await prisma.shopOrder.update({ where: { id }, data: { status, ...(amount !== undefined ? { amount } : {}) } });
  if (status === "COMPLETED") await createShopCommission(id);
  if (status === "CANCELLED") await voidShopCommission(id);
  revalidatePath("/admin/shop");
}
