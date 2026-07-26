import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff } from "@/lib/access";
import { subscribeToTariff } from "./actions";

const PLANS = [
  {
    tariff: "FREE" as const,
    name: "Free",
    price: "0 ₽",
    features: ["1 карта в день", "Полный текст карты — как в колоде", "Глоссарий — полностью открыт"],
  },
  {
    tariff: "STANDARD" as const,
    name: "Standard",
    price: "590 ₽ / мес",
    features: ["1 карта в день", "+ развёрнутое описание", "+ инструкция как пользоваться", "Базовое «Зеркало»"],
  },
  {
    tariff: "PREMIUM" as const,
    name: "Premium",
    price: "3500 ₽ / мес",
    features: [
      "2 карты — основная + по сфере",
      "+ развёрнутое описание и инструкция",
      "Полное «Зеркало» + тренды по сферам",
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
  // Ключей ЮKassa ещё нет (магазин не зарегистрирован — решение владельца,
  // архитектурное ТЗ раздел 8) — до тех пор оплата не должна падать с
  // ошибкой на кнопку, честно показываем "скоро".
  const paymentsEnabled = Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);

  return (
    <main className="flex flex-1 flex-col items-center gap-10 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Тарифы</p>
        <h1 className="font-display text-3xl text-parchment-hi">Плата за зеркало</h1>
        {!paymentsEnabled && (
          <p className="mt-2 font-body text-sm text-bone-dim">
            Оплата подключается — уточните у администратора, когда будет доступна.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.tariff}
            className={`w-72 rounded-lg border p-6 ${
              plan.highlight ? "border-gold shadow-[0_0_0_1px_theme(colors.gold)]" : "border-void-border"
            } bg-void-elevated`}
          >
            {plan.highlight && (
              <p className="mb-2 inline-block rounded bg-red-primary px-2 py-0.5 font-technical text-[10px] uppercase tracking-widest text-parchment">
                Разговор с основателем
              </p>
            )}
            <p className="font-technical text-xs uppercase tracking-widest text-bone-dim">{plan.name}</p>
            <p className={`font-display text-3xl ${plan.highlight ? "text-gold-bright" : "text-parchment-hi"}`}>
              {plan.price}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="font-body text-sm text-bone before:mr-2 before:text-gold before:content-['—']">
                  {f}
                </li>
              ))}
            </ul>

            {plan.tariff === "FREE" ? (
              <p className="mt-6 text-center font-technical text-xs uppercase tracking-widest text-bone-dim">
                {current === "FREE" ? "Ваш текущий тариф" : "Базовый уровень"}
              </p>
            ) : current === plan.tariff ? (
              <p className="mt-6 text-center font-technical text-xs uppercase tracking-widest text-gold-bright">
                Уже подключён
              </p>
            ) : paymentsEnabled ? (
              <form action={subscribeToTariff}>
                <input type="hidden" name="tariff" value={plan.tariff} />
                <button
                  type="submit"
                  className="mt-6 w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                >
                  Оформить
                </button>
              </form>
            ) : (
              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded border border-void-border py-2.5 font-technical text-xs uppercase tracking-widest text-bone-dim"
              >
                Скоро
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
