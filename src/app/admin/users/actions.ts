"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Tariff } from "@/generated/prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN") redirect("/today");
  return user;
}

// Ручное присвоение тарифа — архитектурное ТЗ Фаза 4: "без реальной
// оплаты, ручное присвоение тарифа админом для тестирования".
export async function setUserTariff(formData: FormData) {
  await requireAdmin();

  const userId = formData.get("userId") as string;
  const tariff = formData.get("tariff") as Tariff;
  const days = tariff === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { tariff, tariffExpiresAt: days },
  });

  revalidatePath("/admin/users");
}
