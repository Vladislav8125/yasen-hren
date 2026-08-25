"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

function textValue(formData: FormData, name: string, maxLength: number) {
  const value = (formData.get(name) as string | null)?.trim() ?? "";
  if (!value || value.length > maxLength) throw new Error("Проверьте заполнение полей обращения.");
  return value;
}

export async function submitFeedback(formData: FormData) {
  const user = await requireUser();
  const title = textValue(formData, "title", 140);
  const body = textValue(formData, "body", 4000);

  await prisma.feedbackPost.create({ data: { title, body, authorId: user.id } });
  revalidatePath("/glossary");
  revalidatePath("/admin/glossary");
}

export async function addFeedbackComment(formData: FormData) {
  const user = await requireUser();
  const postId = textValue(formData, "postId", 64);
  const body = textValue(formData, "body", 3000);

  await prisma.$transaction([
    prisma.feedbackComment.create({ data: { postId, body, authorId: user.id } }),
    prisma.feedbackPost.update({ where: { id: postId }, data: { updatedAt: new Date() } }),
  ]);
  revalidatePath("/glossary");
  revalidatePath("/admin/glossary");
}
