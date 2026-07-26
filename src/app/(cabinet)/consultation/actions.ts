"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserAccess, effectiveTariff } from "@/lib/access";

function currentPeriodMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function requestConsultation() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);
  if (!canUserAccess(tariff, "CONSULTATION")) redirect("/tariffs");

  await prisma.consultation.create({
    data: { userId: user.id, periodMonth: currentPeriodMonth() },
  });

  revalidatePath("/consultation");
}
