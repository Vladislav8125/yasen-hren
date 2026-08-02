"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { broadcastToAll, type BroadcastResult } from "@/lib/notifications";

export async function sendBroadcast(formData: FormData): Promise<BroadcastResult & { error?: string }> {
  const session = await auth();
  if (!session?.user) return { total: 0, sent: 0, failed: 0, error: "Не авторизован" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN") return { total: 0, sent: 0, failed: 0, error: "Только для ADMIN" };

  const message = formData.get("message") as string;
  if (!message || message.trim().length < 10) {
    return { total: 0, sent: 0, failed: 0, error: "Сообщение слишком короткое (минимум 10 символов)" };
  }

  const result = await broadcastToAll(message.trim());

  revalidatePath("/admin/broadcast");
  return result;
}
