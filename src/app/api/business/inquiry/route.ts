import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

function clean(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, limit) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = clean(body?.name, 180);
  const phone = clean(body?.phone, 60);
  const website = clean(body?.website, 240);
  if (name.length < 2 || phone.length < 5) {
    return NextResponse.json({ error: "Укажите ФИО и телефон." }, { status: 400 });
  }
  if (website && !/^https?:\/\//i.test(website)) {
    return NextResponse.json({ error: "Укажите адрес сайта начиная с https://" }, { status: 400 });
  }

  const recipient = process.env.BUSINESS_INQUIRY_TO || process.env.SMTP_USER;
  const from = process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  if (!recipient || !from || (!process.env.RESEND_API_KEY && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !password))) {
    return NextResponse.json({ error: "Форма временно недоступна. Напишите на kalashhhova@yandex.ru" }, { status: 503 });
  }

  try {
    const subject = "Заявка на корпоративную программу — Ясен Хрен";
    const text = [`ФИО: ${name}`, `Телефон: ${phone}`, `Сайт: ${website || "не указан"}`].join("\n");
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [recipient], subject, text }),
      });
      if (!response.ok) throw new Error("Resend request failed");
    } else {
      const port = Number(process.env.SMTP_PORT || 465);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
        auth: { user: process.env.SMTP_USER, pass: password },
      });
      await transporter.sendMail({ from, to: recipient, subject, text });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось отправить заявку. Попробуйте позже или напишите на kalashhhova@yandex.ru" }, { status: 503 });
  }
}
