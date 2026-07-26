import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { ArchetypeCard } from "@/components/ArchetypeCard";
import { drawPremiumCard } from "./actions";

const SPHERES: { value: string; label: string; dot: string }[] = [
  { value: "HEALTH", label: "Здоровье", dot: "bg-sphere-health" },
  { value: "RELATIONS", label: "Отношения", dot: "bg-sphere-relations" },
  { value: "BUSINESS", label: "Бизнес", dot: "bg-sphere-business" },
  { value: "HARMONY", label: "Гармония", dot: "bg-sphere-harmony" },
];

function todayLabel() {
  return new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);
  const wantsSecondary = canUserAccess(tariff, "SECOND_CARD");

  const date = new Date();
  const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const existingDraw = await prisma.dailyDraw.findUnique({
    where: { userId_date: { userId: user.id, date: dateOnly } },
  });

  // Premium без карты на сегодня — сначала спросить: рандом или по сфере
  // (дизайн-ТЗ, экран «Выбор второй карты»). После выбора карта дня
  // фиксируется на весь день — это не переспрашивается повторно.
  if (wantsSecondary && !existingDraw) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">{todayLabel()}</p>
        <h1 className="font-display text-3xl text-parchment-hi">Дополняющая карта</h1>
        <p className="font-body text-bone-dim max-w-sm text-center">
          Выбери — вторая карта придёт наугад или под одну из четырёх сфер жизни.
        </p>

        <form action={drawPremiumCard} className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-void-border px-4 py-2 has-checked:border-gold-bright">
              <input type="radio" name="choice" value="random" defaultChecked className="accent-gold" />
              <span className="font-technical text-xs uppercase text-bone">Наугад</span>
            </label>
            {SPHERES.map((s) => (
              <label
                key={s.value}
                className="flex items-center gap-2 rounded-full border border-void-border px-4 py-2 has-checked:border-gold-bright"
              >
                <input type="radio" name="choice" value={s.value} className="accent-gold" />
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                <span className="font-technical text-xs uppercase text-bone">{s.label}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="rounded bg-red-primary px-6 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
          >
            Открыть карту
          </button>
        </form>
      </main>
    );
  }

  const draw = await getOrCreateDailyDraw({
    userId: user.id,
    channel: "WEB",
    wantsSecondary,
  });

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-6">
      <p className="font-technical text-xs uppercase tracking-widest text-gold">{todayLabel()}</p>
      <div className="flex flex-wrap justify-center gap-8">
        <ArchetypeCard archetype={draw.primaryArchetype} tariff={tariff} />
        {draw.secondaryArchetype && <ArchetypeCard archetype={draw.secondaryArchetype} tariff={tariff} />}
      </div>
    </main>
  );
}
