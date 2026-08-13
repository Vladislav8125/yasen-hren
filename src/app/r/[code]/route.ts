import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { codeFromText } from "@/lib/partners";
import { setAttribution } from "@/lib/partners";
import { auth } from "@/auth";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = codeFromText(code);
  const partner = await prisma.partner.findFirst({ where: { code: normalized, status: "ACTIVE" } });
  const target = new URL("/register", request.url);
  const response = NextResponse.redirect(target);
  if (!partner) return response;

  await prisma.referralClick.create({
    data: { partnerId: partner.id, targetPath: "/register", referer: request.headers.get("referer")?.slice(0, 500) ?? null },
  });
  // Для уже авторизованного покупателя последний переход меняет привязку сразу.
  const session = await auth();
  if (session?.user?.id) await setAttribution({ userId: session.user.id, partnerId: partner.id, source: "link" });
  response.cookies.set("yh_ref", normalized, {
    maxAge: 90 * 24 * 60 * 60, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
  });
  return response;
}
