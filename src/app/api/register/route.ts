import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const phone = typeof body?.phone === "string" && body.phone.trim() ? body.phone.trim() : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Заполните имя, email и пароль" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не короче 8 символов" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone },
    });
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "";
      const field = target.includes("phone") ? "телефон" : "email";
      return NextResponse.json({ error: `Такой ${field} уже зарегистрирован` }, { status: 409 });
    }
    throw error;
  }
}
