import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { getMirrorData, sphereLabel } from "@/lib/mirror";
import { ArchetypeCard } from "@/components/ArchetypeCard";

const FAMILY_DOT: Record<string, string> = {
  LIGHT: "bg-parchment",
  SHADOW: "bg-void-border",
  LIMINAL: "bg-teal",
  PATH: "bg-stone-light",
};

export default async function MirrorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);

  if (!canUserAccess(tariff, "MIRROR")) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Зеркало</p>
        <h1 className="font-display text-3xl text-parchment-hi">Доступно со Standard</h1>
        <p className="font-body text-bone-dim max-w-sm">
          Разовая карта — расходник. «Зеркало» копит статистику твоих архетипов месяц за месяцем.
        </p>
        <Link
          href="/tariffs"
          className="rounded bg-red-primary px-6 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment-hi hover:bg-red-primary-dark"
        >
          Смотреть тарифы
        </Link>
      </main>
    );
  }

  const hasFullMirror = canUserAccess(tariff, "MIRROR_FULL");
  const data = await getMirrorData(user.id);

  const pathCards = await prisma.archetype.findMany({
    where: { family: "PATH" },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col items-center gap-10 p-6">
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

          <section className="w-full max-w-3xl">
            <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-3 text-center">
              Лента последних карт
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {data.timeline.map((t, i) => (
                <div
                  key={i}
                  title={`${t.name} — ${new Date(t.date).toLocaleDateString("ru-RU")}`}
                  className="relative h-16 w-11 overflow-hidden rounded border border-void-border"
                >
                  {t.imageUrl && <Image src={t.imageUrl} alt={t.name} fill className="object-cover" />}
                  <span className={`absolute bottom-0 left-0 right-0 h-1 ${FAMILY_DOT[t.family]}`} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="w-full max-w-2xl border-t border-void-border pt-8">
        <h2 className="font-display text-2xl text-parchment-hi text-center mb-1">Путь Путника</h2>
        <p className="font-body text-sm text-bone-dim text-center mb-6">
          Отдельный трек долгосрочного развития — открывай карты вручную, не по расписанию.
        </p>
        <div className="flex flex-col gap-3">
          {pathCards.map((card) => (
            <details key={card.id} className="rounded-lg border border-void-border bg-void-elevated p-4">
              <summary className="cursor-pointer font-display text-lg text-gold-bright">{card.name}</summary>
              <div className="mt-4 flex justify-center">
                <ArchetypeCard archetype={card} tariff={tariff} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
