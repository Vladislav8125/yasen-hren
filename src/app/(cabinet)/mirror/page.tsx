import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { getMirrorData, sphereLabel, generatePathInsight } from "@/lib/mirror";
import { DailyCarousel } from "@/components/DailyCarousel";
import { ArchetypeCard } from "@/components/ArchetypeCard";

export default async function MirrorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);

  if (!canUserAccess(tariff, "MIRROR")) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Зеркало</p>
        <h1 className="font-display text-3xl text-parchment-hi">Доступно со Standard</h1>
        <p className="font-body text-bone-dim max-w-sm">
          Разовая карта — расходник. «Зеркало» копит статистику твоих архетипов месяц за месяцем.
        </p>
        <Link
          href="/tariffs"
          className="rounded bg-red-primary px-6 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
        >
          Смотреть тарифы
        </Link>
      </div>
    );
  }

  const hasFullMirror = canUserAccess(tariff, "MIRROR_FULL");
  const data = await getMirrorData(user.id);

  // Генерируем LLM-описания для карт Путника
  const pathInsights = await Promise.all(
    data.pathTimeline.map(async (entry) => {
      const beforeCards = data.dailyTimeline
        .filter((d) => new Date(d.date) < new Date(entry.date))
        .slice(0, 5)
        .map((d) => ({ name: d.archetype.name, tagline: "" }));

      const beforeDraws = await prisma.dailyDraw.findMany({
        where: { userId: user.id, date: { lt: entry.date } },
        orderBy: { date: "desc" },
        take: 7,
        include: { primaryArchetype: { select: { name: true, tagline: true } } },
      });

      const beforeList = beforeDraws.map((d) => ({
        name: d.primaryArchetype.name,
        tagline: d.primaryArchetype.tagline,
      }));

      const insight = await generatePathInsight({
        pathCard: {
          name: entry.archetype.name,
          essence: entry.archetype.essence,
          tagline: entry.archetype.tagline,
        },
        beforeCards: beforeList,
      });

      return { entry, insight };
    }),
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">
          Зеркало · последние {data.windowDays} дней
        </p>
        <h1 className="font-display text-3xl text-parchment-hi">Твои архетипы</h1>
      </div>

      {data.totalDraws === 0 ? (
        <p className="font-body text-bone-dim">
          Пока нет истории — открой карту дня, и через несколько дней здесь появится первая картина.
        </p>
      ) : (
        <>
          <section className="flex flex-wrap justify-center gap-6">
            {data.topArchetypes.map((a) => (
              <div key={a.id} className="w-64 rounded-lg border border-void-border bg-void-elevated p-4 text-center">
                <p className="font-display text-2xl text-gold-bright">{a.name}</p>
                <p className="font-technical text-xs uppercase tracking-widest text-bone-dim mb-2">
                  {a.count} раз(а) за {data.windowDays} дней
                </p>
                <p className="font-body text-sm text-bone">{a.essence}</p>
              </div>
            ))}
          </section>

          {hasFullMirror && data.sphereTrends.length > 0 && (
            <section className="w-full max-w-2xl">
              <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-3 text-center">
                Тренды по сферам
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {data.sphereTrends.map((s) => (
                  <span
                    key={s.sphere}
                    className="rounded-full border border-void-border px-4 py-1.5 font-body text-sm text-bone"
                  >
                    {sphereLabel(s.sphere)} · {s.count}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Карты за 7 дней */}
          <section className="w-full max-w-3xl">
            <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-1 text-center">
              Карты за 7 дней
            </h2>
            <p className="font-body text-sm text-bone-dim text-center mb-4">
              Какие архетипы выпадали — нажми на карту, чтобы рассмотреть
            </p>
            <div className="flex justify-center">
              <DailyCarousel cards={data.dailyTimeline} />
            </div>
          </section>

          {/* Карты Путника */}
          {data.pathTimeline.length > 0 && (
            <section className="w-full max-w-3xl border-t border-void-border pt-10">
              <h2 className="font-display text-2xl text-parchment-hi text-center mb-1">
                Карты Путника
              </h2>
              <p className="font-body text-sm text-bone-dim text-center mb-8">
                Раз в неделю приходит карта пути. Она показывает — что было и где ты сейчас.
              </p>

              <div className="flex flex-col gap-8">
                {pathInsights.map(({ entry, insight }) => (
                  <div
                    key={`${entry.date.toISOString()}-${entry.archetype.id}`}
                    className="space-y-4"
                  >
                    <div
                      className="rounded-lg border border-void-border bg-void-elevated p-4 font-body text-sm text-bone leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: insight.replace(/\n/g, "<br>"),
                      }}
                    />

                    <div className="flex justify-center">
                      <ArchetypeCard archetype={entry.archetype} tariff={tariff} revealed />
                    </div>
                    <p className="text-center font-technical text-xs text-bone-dim">
                      {new Date(entry.date).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.pathTimeline.length === 0 && (
            <section className="w-full max-w-3xl border-t border-void-border pt-10">
              <h2 className="font-display text-2xl text-parchment-hi text-center mb-1">
                Карты Путника
              </h2>
              <p className="font-body text-sm text-bone-dim text-center">
                Карты Путника ещё не выпадали — они приходят раз в неделю.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
