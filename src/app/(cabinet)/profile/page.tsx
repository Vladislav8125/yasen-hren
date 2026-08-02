import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff, canUserAccess } from "@/lib/access";
import { createTelegramLinkToken } from "@/lib/telegramLink";

const TARIFF_LABEL: Record<string, string> = {
  FREE: "Free",
  STANDARD: "Standard · 590 ₽/мес",
  PREMIUM: "Premium · 3500 ₽/мес",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  const tariff = effectiveTariff(user);
  const expired = user.tariff !== "FREE" && tariff === "FREE";

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "yasenhren_bot";
  const telegramLinkUrl = `https://t.me/${botUsername}?start=${createTelegramLinkToken(user.id)}`;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-void-border bg-void-elevated p-8">
        <p className="font-technical text-xs uppercase tracking-widest text-gold mb-1.5">
          Личный кабинет
        </p>
        <h1 className="font-display text-3xl text-parchment-hi mb-8">{user.name}</h1>

        <dl className="space-y-4 font-body text-bone">
          <div className="flex justify-between border-b border-void-border pb-3">
            <dt className="text-bone-dim">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-void-border pb-3">
            <dt className="text-bone-dim">Телефон</dt>
            <dd>{user.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-void-border pb-3">
            <dt className="text-bone-dim">Тариф</dt>
            <dd className="text-gold-bright">
              {TARIFF_LABEL[tariff]}
              {expired && <span className="block text-xs text-red-warning">подписка истекла</span>}
            </dd>
          </div>
          {user.tariffExpiresAt && tariff !== "FREE" && (
            <div className="flex justify-between border-b border-void-border pb-3">
              <dt className="text-bone-dim">Действует до</dt>
              <dd>{user.tariffExpiresAt.toLocaleDateString("ru-RU")}</dd>
            </div>
          )}
          <div className="flex justify-between border-b border-void-border pb-3">
            <dt className="text-bone-dim">Telegram</dt>
            <dd className={user.telegramChatId ? "text-green-600" : "text-bone-dim"}>
              {user.telegramChatId ? "привязан ✓" : "не привязан"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bone-dim">С нами с</dt>
            <dd>{user.createdAt.toLocaleDateString("ru-RU")}</dd>
          </div>
        </dl>

        {!user.telegramChatId && (
          <a
            href={telegramLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded border border-gold py-2.5 text-center font-technical text-xs uppercase tracking-widest text-gold hover:text-gold-bright"
          >
            Привязать Telegram
          </a>
        )}

        <Link
          href="/tariffs"
          className="mt-6 block w-full rounded bg-red-primary py-2.5 text-center font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
        >
          {tariff === "FREE" ? "Оформить подписку" : "Управление подпиской"}
        </Link>

        {canUserAccess(tariff, "CONSULTATION") && (
          <Link
            href="/consultation"
            className="mt-3 block w-full rounded border border-gold py-2.5 text-center font-technical text-xs uppercase tracking-widest text-gold hover:text-gold-bright"
          >
            Записаться на консультацию
          </Link>
        )}
      </div>
    </div>
  );
}
