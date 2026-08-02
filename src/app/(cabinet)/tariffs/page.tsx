import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff } from "@/lib/access";
import { subscribeToTariff } from "./actions";

const PLANS = [
  {
    tariff: "FREE" as const,
    name: "Базовый уровень",
    price: "0 ₽",
    features: ["1 карта в день", "Короткое описание карты", "Глоссарий — полностью открыт"],
  },
  {
    tariff: "STANDARD" as const,
    name: "Standard",
    price: "590 ₽ / мес",
    features: ["1 карта в день", "+ развёрнутое описание", "+ инструкция как пользоваться", "Базовое «Зеркало» *"],
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
              ) : (
                <form action={subscribeToTariff}>
                  <input type="hidden" name="tariff" value={plan.tariff} />
                  <button
                    type="submit"
                    className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                  >
                    Оформить
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
