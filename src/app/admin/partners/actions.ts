"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN") redirect("/today");
}

export async function payPartnerBalance(formData: FormData) {
  await requireAdmin();
  const partnerId = String(formData.get("partnerId"));
  const { _sum } = await prisma.referralCommission.aggregate({ where: { partnerId, status: "APPROVED" }, _sum: { amount: true } });
  const amount = _sum.amount ?? 0;
  if (amount < 200_000) throw new Error("Выплата доступна от 2 000 ₽");
  await prisma.referralCommission.updateMany({ where: { partnerId, status: "APPROVED" }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/admin/partners");
}
