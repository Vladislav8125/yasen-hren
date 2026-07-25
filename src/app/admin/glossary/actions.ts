"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireModerator() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") redirect("/today");
  return user;
}

export async function moderateTerm(formData: FormData) {
  const moderator = await requireModerator();

  const termId = formData.get("termId") as string;
  const decision = formData.get("decision") as "approved" | "rejected";

  await prisma.glossaryTerm.update({
    where: { id: termId },
    data: { status: decision, moderatedById: moderator.id },
  });

  revalidatePath("/admin/glossary");
  revalidatePath("/glossary");
}
