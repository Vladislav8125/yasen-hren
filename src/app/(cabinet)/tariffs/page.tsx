import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff } from "@/lib/access";
import { isRobokassaConfigured, isRobokassaRecurringEnabled } from "@/lib/robokassa";
import { startPremiumTrial, subscribeToAddon, subscribeToTariff } from "./actions";

const PLANS = [
  {
    tariff: "FREE" as const,
    name: "Базовый уровень",
    price: "0 ₽",
    features: ["1 карта в день", "Короткое описание карты", "35 карт основной колоды и 8 карт Путника", "Обратная связь — полностью открыта"],
  },
  {
    tariff: "STANDARD" as const,
    name: "Стандарт",
    price: "590 ₽ / мес",
    features: ["1 карта в день", "+ развёрнутое описание", "+ инструкция как пользоваться", "35 карт основной колоды и 8 карт Путника", "Базовый «Мой путь» *"],
  },
  {
    tariff: "PREMIUM" as const,
    name: "Премиум",
    price: "3 500 ₽ / мес",
    features: [
      "2 карты в день",
      "Выбор сферы жизни для второй карты",
      "Развёрнутое описание",
      "Инструкция использования",
      "35 карт основной колоды и 8 карт Путника",
      "Полный «Мой путь» *",
      "Консультация с основателем, 1 раз/мес",
    ],
    highlight: true,
  },
];

export default async function TariffsPage({ searchParams }: { searchParams: Promise<{ trial?: string; select?: string; channel?: string }> }) {
  const params = await searchParams;
  const requestedChannel = params.channel === "VK" || params.channel === "MAX" ? params.channel : "TELEGRAM";
  const selectedTariff = params.select === "STANDARD" || params.select === "PREMIUM" ? params.select : null;
  const session = await auth();
  if (!session?.user) redirect(`/register?tariff=${selectedTariff ?? "FREE"}&channel=${requestedChannel}`);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const current = effectiveTariff(user);
  const paymentsReady = isRobokassaConfigured();
  const recurringPaymentsEnabled = isRobokassaRecurringEnabled();
  const trialActive = user.premiumTrialExpiresAt && user.premiumTrialExpiresAt > new Date();

  const isCurrent = (tariff: string) => tariff === current;

  const statusText = () => {
    if (user.tariffExpiresAt?.getUTCFullYear() === 9999) {
      return "Подключён бессрочно";
    }
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

      <p className="w-full max-w-4xl rounded-xl border border-gold/30 bg-void-elevated p-4 text-center font-body text-sm leading-relaxed text-bone-dim">
        {recurringPaymentsEnabled
          ? "После подтверждения оплаты тариф действует 30 дней и продлевается автоматически. Управлять автопродлением можно в профиле."
          : "Тариф действует 30 дней после оплаты. Автоматические списания сейчас выключены; продлить доступ можно вручную в любой момент."}
      </p>

      <section className="w-full max-w-4xl rounded-2xl border border-gold/50 bg-void-elevated p-6 md:p-8">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Пробный доступ</p>
        <h2 className="mt-2 font-display text-2xl text-parchment-hi">Премиум на 10 дней</h2>
        <p className="mt-2 max-w-2xl font-body leading-relaxed text-bone-dim">
          Без оплаты и без привязки карты. Доступ действует один раз для каждого аккаунта.
        </p>
        {params.trial === "activated" && <p className="mt-3 rounded border border-green-700/60 bg-green-950/30 p-3 font-body text-sm text-green-300">Пробный тариф «Премиум» активирован.</p>}
        {params.trial === "invalid" && <p className="mt-3 rounded border border-red-700/60 bg-red-950/30 p-3 font-body text-sm text-red-300">Промокод не найден.</p>}
        {params.trial === "promo-activated" && <p className="mt-3 rounded border border-green-700/60 bg-green-950/30 p-3 font-body text-sm text-green-300">Промокод активирован: тариф «Премиум» подключён на 30 дней.</p>}
        {params.trial === "promo-used" && <p className="mt-3 rounded border border-red-700/60 bg-red-950/30 p-3 font-body text-sm text-red-300">Этот промокод уже использован или срок его действия закончился.</p>}
        {params.trial === "already-used" && <p className="mt-3 rounded border border-void-border p-3 font-body text-sm text-bone-dim">Пробный период уже использован.</p>}
        {params.trial === "premium-active" && <p className="mt-3 rounded border border-void-border p-3 font-body text-sm text-bone-dim">У вас уже действует платный тариф «Премиум».</p>}
        {trialActive ? (
          <p className="mt-5 rounded border border-gold p-3 font-technical text-xs uppercase tracking-widest text-gold-bright">
            Пробный тариф «Премиум» действует до {user.premiumTrialExpiresAt?.toLocaleDateString("ru-RU")} 
          </p>
        ) : user.premiumTrialUsedAt ? (
          <p className="mt-5 font-body text-sm text-bone-dim">Пробный период уже использован. Для продолжения оформите тариф ниже.</p>
        ) : (
          <form action={startPremiumTrial} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <select name="channel" defaultValue={requestedChannel} className="rounded border border-void-border bg-void px-3 py-2 text-sm text-bone">
              <option value="TELEGRAM">Telegram</option><option value="VK">ВКонтакте</option><option value="MAX">MAX</option>
            </select>
            <button type="submit" className="w-full rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark sm:w-auto">
              Попробовать 10 дней
            </button>
          </form>
        )}
        <form action={startPremiumTrial} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <select name="channel" defaultValue={requestedChannel} className="rounded border border-void-border bg-void px-3 py-2 text-sm text-bone">
            <option value="TELEGRAM">Telegram</option><option value="VK">ВКонтакте</option><option value="MAX">MAX</option>
          </select>
          <input name="promoCode" required placeholder="Промокод на тариф «Премиум» на месяц" className="min-w-0 flex-1 rounded border border-void-border bg-void px-3 py-2 text-sm text-bone" />
          <button type="submit" className="rounded border border-gold px-4 py-2 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10">Активировать код</button>
        </form>
      </section>

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
                const isMirror = f.includes("Мой путь");
                return (
                  <li key={f} className="font-body text-sm text-bone before:mr-2 before:text-gold before:content-['—']">
                    {isMirror ? (
                      <span
                        title="Мой путь — твоя персональная статистика: какие архетипы выпадают чаще, тренды по сферам и путь развития."
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
                  <label className="mb-2 block font-body text-xs text-bone-dim">Площадка для бота
                    <select name="channel" defaultValue={requestedChannel} className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-sm text-bone">
                      <option value="TELEGRAM">Telegram</option>
                      <option value="VK">ВКонтакте</option>
                      <option value="MAX">MAX</option>
                    </select>
                  </label>
                  <input name="promoCode" placeholder="Промокод партнёра" className="mb-2 w-full rounded border border-void-border bg-void px-3 py-2 text-sm text-bone" />
                  <button
                    type="submit"
                    className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                  >
                    {selectedTariff === plan.tariff ? "Перейти к оплате" : "Выбрать тариф"}
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
      {current !== "FREE" && !user.legacyAllPlatforms && (
        <section className="w-full max-w-4xl rounded-2xl border border-gold/40 bg-void-elevated p-6 md:p-8">
          <p className="font-technical text-xs uppercase tracking-widest text-gold">Дополнительная площадка</p>
          <h2 className="mt-2 font-display text-2xl text-parchment-hi">Подключить ещё один бот</h2>
          <p className="mt-2 font-body text-sm text-bone-dim">290 ₽ за полный месяц. До ближайшей даты продления сумма рассчитывается пропорционально.</p>
          <form action={subscribeToAddon} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <select name="channel" className="rounded border border-void-border bg-void px-3 py-2 text-bone">
              <option value="TELEGRAM">Telegram</option><option value="VK">ВКонтакте</option><option value="MAX">MAX</option>
            </select>
            <button className="rounded bg-red-primary px-5 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment">Рассчитать и подключить</button>
          </form>
        </section>
      )}
      <section className="w-full max-w-4xl rounded-2xl border border-gold/40 bg-void-elevated p-6 md:p-8">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Для команд и HR</p>
        <h2 className="mt-2 font-display text-2xl text-parchment-hi">Нужен формат для команды?</h2>
        <p className="mt-3 max-w-2xl font-body leading-relaxed text-bone-dim">Игра, фасилитация и работа с командной динамикой для сотрудников, руководителей и HR. Это отдельный корпоративный формат, не часть индивидуального тарифа.</p>
        <a href="/partners" className="mt-5 inline-block rounded border border-gold px-5 py-3 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10">Обсудить с Академией</a>
      </section>
    </div>
  );
}
