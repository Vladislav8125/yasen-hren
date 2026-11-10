import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { getMirrorData, sphereLabel } from "@/lib/mirror";
import { WeekThread } from "@/components/WeekThread";
import { SphereTrends } from "@/components/SphereTrends";

export default async function MirrorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);
  if (!canUserAccess(tariff, "MIRROR")) return <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"><p className="font-technical text-xs uppercase tracking-widest text-gold">Мой путь</p><h1 className="font-display text-3xl text-parchment-hi">Доступно с тарифом «Стандарт»</h1><p className="max-w-sm font-body text-bone-dim">Разовая карта — расходник. «Мой путь» копит историю твоих архетипов месяц за месяцем.</p><Link href="/tariffs" className="rounded bg-red-primary px-6 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Смотреть тарифы</Link></div>;
  const hasFullMirror = canUserAccess(tariff, "MIRROR_FULL");
  const data = await getMirrorData(user.id);
  const trends = data.sphereTrends.map((trend) => ({ sphere: trend.sphere, label: sphereLabel(trend.sphere), count: trend.count }));

  return <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-5 py-10 sm:px-8">
    <header className="max-w-3xl rounded-2xl bg-[#fff8e6] p-6 shadow-[0_16px_46px_-34px_rgba(42,27,19,.8)] sm:p-8"><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#241c17]">Мой путь · последние {data.windowDays} дней</p><h1 className="mt-3 font-display text-5xl text-[#241c17] sm:text-6xl">След, который оставляют карты</h1><p className="mt-5 font-body text-lg leading-relaxed text-[#4b4035]">Здесь видна не оценка, а дорога: что повторяется и во что складывается неделя.</p></header>
    {data.totalDraws === 0 ? <p className="font-body text-bone-dim">Пока нет истории — открой карту дня, и через несколько дней здесь появится первая картина.</p> : <>
      <WeekThread cards={data.dailyTimeline} pathCards={data.pathTimeline} />
      <section className="border-t border-void-border pt-12"><div className="inline-block rounded-lg bg-[#fff8e6] px-4 py-2"><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-[#241c17]">Повторяющиеся мотивы</p></div><h2 className="mt-4 font-display text-3xl text-parchment-hi">Что чаще звучит в пути</h2><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.topArchetypes.map((archetype) => <article key={archetype.id} className="rounded-2xl border border-void-border bg-void-elevated p-5"><p className="font-display text-2xl text-gold-bright">{archetype.name}</p><p className="mb-3 font-technical text-[10px] uppercase tracking-widest text-bone-dim">{archetype.count} раз(а) за {data.windowDays} дней</p><p className="font-body text-sm leading-relaxed text-bone">{archetype.essence}</p></article>)}</div></section>
      {hasFullMirror && trends.length > 0 && <SphereTrends trends={trends} />}
    </>}
  </div>;
}
