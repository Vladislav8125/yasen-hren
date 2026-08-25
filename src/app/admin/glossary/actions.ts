"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = ["OPEN", "PLANNED", "IN_PROGRESS", "COMPLETED", "CLOSED"] as const;

async function requireModerator() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/today");
  return user;
}

export async function updateFeedbackStatus(formData: FormData) {
  await requireModerator();
  const postId = (formData.get("postId") as string | null)?.trim();
  const status = formData.get("status") as (typeof STATUSES)[number] | null;
  if (!postId || !status || !STATUSES.includes(status)) throw new Error("Некорректный статус обращения.");

  await prisma.feedbackPost.update({ where: { id: postId }, data: { status } });
  revalidatePath("/admin/glossary");
  revalidatePath("/glossary");
}

export async function addModeratorComment(formData: FormData) {
  const moderator = await requireModerator();
  const postId = (formData.get("postId") as string | null)?.trim();
  const body = (formData.get("body") as string | null)?.trim();
  if (!postId || !body || body.length > 3000) throw new Error("Проверьте текст комментария.");

  await prisma.$transaction([
    prisma.feedbackComment.create({ data: { postId, body, authorId: moderator.id } }),
    prisma.feedbackPost.update({ where: { id: postId }, data: { updatedAt: new Date() } }),
  ]);
  revalidatePath("/admin/glossary");
  revalidatePath("/glossary");
}
