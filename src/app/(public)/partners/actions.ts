"use server";

import { prisma } from "@/lib/prisma";
import type { PartnerRequestType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function sendPartnerRequest(formData: FormData) {
  const type = formData.get("type") as PartnerRequestType;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email || !message || !["SPEAKING", "EVENT_GAME", "MEDIA"].includes(type)) throw new Error("Заполните обязательные поля");
  await prisma.partnerRequest.create({ data: { type, name, email, company: company || null, message } });
  revalidatePath("/partners");
}
