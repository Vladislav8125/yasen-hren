"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Глоссарий доступен на всех тарифах без ограничений (решение из брифа —
// открытое пространство сообщества). Предложить термин может любой
// залогиненный пользователь; ADMIN добавляет без модерации (решение из
// дизайн-ТЗ), MODERATOR/USER — уходит в очередь на одобрение.
export async function submitTerm(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const term = (formData.get("term") as string)?.trim();
  const definition = (formData.get("definition") as string)?.trim();
  if (!term || !definition) return;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const autoApproved = user.role === "ADMIN";

  await prisma.glossaryTerm.create({
    data: {
      term,
      definition,
      submittedById: user.id,
      status: autoApproved ? "approved" : "pending",
      moderatedById: autoApproved ? user.id : null,
    },
  });

  revalidatePath("/glossary");
}
