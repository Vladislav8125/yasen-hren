"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN") redirect("/today");
  return user;
}

export async function scheduleConsultation(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const meetingLink = formData.get("meetingLink") as string;

  await prisma.consultation.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      meetingLink: meetingLink || null,
    },
  });

  revalidatePath("/admin/consultations");
}

export async function markConsultationDone(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const decision = formData.get("decision") as "COMPLETED" | "CANCELLED";

  await prisma.consultation.update({ where: { id }, data: { status: decision } });
  revalidatePath("/admin/consultations");
}
