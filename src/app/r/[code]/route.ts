import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { codeFromText, resolveLinkPartner, setAttribution } from "@/lib/partners";
import { auth } from "@/auth";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = codeFromText(code);
  const session = await auth();
  const partner = await resolveLinkPartner(normalized);
  const target = new URL(session?.user?.id ? "/today" : "/register", request.url);
  const response = NextResponse.redirect(target);
  if (!partner) return response;
  if (session?.user?.id === partner.userId) return response;

  await prisma.referralClick.create({
    data: { partnerId: partner.id, targetPath: "/register", referer: request.headers.get("referer")?.slice(0, 500) ?? null },
  });
  // Для уже авторизованного покупателя последний переход меняет привязку сразу.
  if (session?.user?.id) await setAttribution({ userId: session.user.id, partnerId: partner.id, source: "link" });
  response.cookies.set("yh_ref", normalized, {
    maxAge: 90 * 24 * 60 * 60, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
  });
  return response;
}
