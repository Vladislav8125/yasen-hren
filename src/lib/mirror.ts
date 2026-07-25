import { prisma } from "@/lib/prisma";
import type { LifeSphere } from "@/generated/prisma/client";

// «Зеркало» — архитектурное ТЗ, раздел 6. Источник данных — история
// DailyDraw, без отдельной денормализованной таблицы (агрегируем на лету,
// преждевременная оптимизация не нужна при текущих объёмах).

const WINDOW_DAYS = 30;

export async function getMirrorData(userId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);

  const draws = await prisma.dailyDraw.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
    include: { primaryArchetype: true },
  });

  const freq = new Map<string, { id: string; name: string; family: string; essence: string; count: number }>();
  for (const draw of draws) {
    const a = draw.primaryArchetype;
    const entry = freq.get(a.id) ?? { id: a.id, name: a.name, family: a.family, essence: a.essence, count: 0 };
    entry.count++;
    freq.set(a.id, entry);
  }
  const topArchetypes = [...freq.values()].sort((a, b) => b.count - a.count).slice(0, 3);

  const sphereCounts = new Map<LifeSphere, number>();
  for (const draw of draws) {
    for (const sphere of draw.primaryArchetype.spheres) {
      sphereCounts.set(sphere, (sphereCounts.get(sphere) ?? 0) + 1);
    }
  }
  const sphereTrends = [...sphereCounts.entries()]
    .map(([sphere, count]) => ({ sphere, count }))
    .sort((a, b) => b.count - a.count);

  return {
    windowDays: WINDOW_DAYS,
    totalDraws: draws.length,
    topArchetypes,
    sphereTrends,
    timeline: draws.map((d) => ({
      date: d.date,
      name: d.primaryArchetype.name,
      family: d.primaryArchetype.family,
      imageUrl: d.primaryArchetype.imageUrl,
    })),
  };
}

const SPHERE_LABEL: Record<LifeSphere, string> = {
  HEALTH: "Здоровье",
  RELATIONS: "Отношения",
  BUSINESS: "Бизнес",
  HARMONY: "Гармония",
};

export function sphereLabel(sphere: LifeSphere) {
  return SPHERE_LABEL[sphere];
}
