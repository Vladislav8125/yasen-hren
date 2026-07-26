"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import type { LifeSphere } from "@/generated/prisma/client";

const VALID_SPHERES = new Set(["HEALTH", "RELATIONS", "BUSINESS", "HARMONY"]);

export async function drawPremiumCard(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const choice = formData.get("choice") as string;
  const isSphere = VALID_SPHERES.has(choice);

  await getOrCreateDailyDraw({
    userId: session.user.id,
    channel: "WEB",
    wantsSecondary: true,
    secondaryMode: isSphere ? "sphere" : "random",
    sphere: isSphere ? (choice as LifeSphere) : undefined,
  });

  redirect("/today");
}
