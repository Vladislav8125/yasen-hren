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

export async function markCommissionPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.referralCommission.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  revalidatePath("/admin/partners");
}
