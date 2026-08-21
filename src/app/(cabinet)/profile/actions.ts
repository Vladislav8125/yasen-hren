"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { cancelRobokassaAutoRenewal, resumeRobokassaAutoRenewal } from "@/lib/robokassa";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Требуется вход в аккаунт.");
  return session.user.id;
}

export async function cancelAutoRenewal() {
  await cancelRobokassaAutoRenewal(await requireUserId());
  revalidatePath("/profile");
}

export async function resumeAutoRenewal() {
  await resumeRobokassaAutoRenewal(await requireUserId());
  revalidatePath("/profile");
}
