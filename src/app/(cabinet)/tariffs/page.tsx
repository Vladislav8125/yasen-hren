import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff } from "@/lib/access";
import { isRobokassaConfigured } from "@/lib/robokassa";
import { subscribeToTariff } from "./actions";

const PLANS = [
  {
    tariff: "FREE" as const,
    name: "Базовый уровень",
    price: "0 ₽",
    features: ["1 карта в день", "Короткое описание карты", "35 карт основной колоды и 8 карт Путника", "Глоссарий — полностью открыт"],
  },
  {
    tariff: "STANDARD" as const,
    name: "Standard",
    price: "590 ₽ / мес",
    features: ["1 карта в день", "+ развёрнутое описание", "+ инструкция как пользоваться", "35 карт основной колоды и 8 карт Путника", "Базовое «Зеркало» *"],
  },
  {
    tariff: "PREMIUM" as const,
    name: "Premium",
    price: "3 500 ₽ / мес",
    features: [
      "2 карты в день",
      "Выбор сферы жизни для второй карты",
      "Развёрнутое описание",
      "Инструкция использования",
      "35 карт основной колоды и 8 карт Путника",
      "Полное «Зеркало» *",
      "Консультация с основателем, 1 раз/мес",
    ],
    highlight: true,
  },
];

export default async function TariffsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const current = effectiveTariff(user);
  const paymentsReady = isRobokassaConfigured();

  const isCurrent = (tariff: string) => tariff === current;

  const statusText = () => {
    if (user.tariffExpiresAt) {
      return `Подключён до ${user.tariffExpiresAt.toLocaleDateString("ru-RU")}`;
    }
    return "Подключён";
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Тарифы</p>
        <h1 className="font-display text-3xl text-parchment-hi">Тарифы</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.tariff}
            className={`flex w-72 flex-col rounded-lg border p-6 h-full ${
              plan.highlight ? "border-gold shadow-[0_0_0_1px_theme(colors.gold)]" : "border-void-border"
            } bg-void-elevated`}
          >
            <p className="font-technical text-xs uppercase tracking-widest text-bone-dim">{plan.name}</p>
            <p className={`font-display text-3xl ${plan.highlight ? "text-gold-bright" : "text-parchment-hi"}`}>
              {plan.price}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => {
                const isMirror = f.includes("Зеркало");
                return (
                  <li key={f} className="font-body text-sm text-bone before:mr-2 before:text-gold before:content-['—']">
                    {isMirror ? (
                      <span
                        title="Зеркало — твоя персональная статистика: какие архетипы выпадают чаще, тренды по сферам жизни, путь развития."
                        className="cursor-help"
                      >
                        {f}
                      </span>
                    ) : (
                      f
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pt-6">
              {plan.tariff === "FREE" ? (
                <p className="text-center font-technical text-xs uppercase tracking-widest text-bone-dim">
                  {isCurrent("FREE") ? statusText() : "Базовый уровень"}
                </p>
              ) : isCurrent(plan.tariff) ? (
                <p className="rounded border border-gold p-2.5 text-center font-technical text-xs uppercase tracking-widest text-gold-bright">
                  {statusText()}
                </p>
              ) : paymentsReady ? (
                <form action={subscribeToTariff}>
                  <input type="hidden" name="tariff" value={plan.tariff} />
                  <input name="promoCode" placeholder="Промокод партнёра" className="mb-2 w-full rounded border border-void-border bg-void px-3 py-2 text-sm text-bone" />
                  <button
                    type="submit"
                    className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                  >
                    Оформить
                  </button>
                </form>
              ) : (
                <p className="text-center font-body text-sm text-bone-dim">
                  Приём платежей скоро будет подключён
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <section className="w-full max-w-4xl rounded-2xl border border-gold/40 bg-void-elevated p-6 md:p-8">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Для команд и HR</p>
        <h2 className="mt-2 font-display text-2xl text-parchment-hi">Нужен формат для команды?</h2>
        <p className="mt-3 max-w-2xl font-body leading-relaxed text-bone-dim">Игра, фасилитация и работа с командной динамикой для сотрудников, руководителей и HR. Это отдельный корпоративный формат, не часть индивидуального тарифа.</p>
        <a href="/partners" className="mt-5 inline-block rounded border border-gold px-5 py-3 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10">Обсудить с Академией</a>
      </section>
    </div>
  );
}
