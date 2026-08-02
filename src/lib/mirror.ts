import { prisma } from "@/lib/prisma";
import type { LifeSphere } from "@/generated/prisma/client";

// «Зеркало» — статистика, карты дня и карты Путника с LLM-анализом.

const WINDOW_DAYS = 30;
const DAILY_WINDOW = 7;

export async function getMirrorData(userId: string) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - WINDOW_DAYS);

  const draws = await prisma.dailyDraw.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
    include: { primaryArchetype: true, secondaryArchetype: true, pathArchetype: true },
  });

  // Топ архетипов
  const freq = new Map<string, { id: string; name: string; family: string; essence: string; count: number }>();
  for (const draw of draws) {
    for (const rel of [draw.primaryArchetype, draw.secondaryArchetype]) {
      if (!rel) continue;
      const entry = freq.get(rel.id) ?? { id: rel.id, name: rel.name, family: rel.family, essence: rel.essence, count: 0 };
      entry.count++;
      freq.set(rel.id, entry);
    }
  }
  const topArchetypes = [...freq.values()].sort((a, b) => b.count - a.count).slice(0, 3);

  // Тренды по сферам
  const sphereCounts = new Map<LifeSphere, number>();
  for (const draw of draws) {
    for (const sphere of draw.primaryArchetype.spheres) {
      sphereCounts.set(sphere, (sphereCounts.get(sphere) ?? 0) + 1);
    }
  }
  const sphereTrends = [...sphereCounts.entries()]
    .map(([sphere, count]) => ({ sphere, count }))
    .sort((a, b) => b.count - a.count);

  // Карты за последние 7 дней — карусель
  const recentDraws = await prisma.dailyDraw.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: DAILY_WINDOW,
    include: {
      primaryArchetype: { select: { id: true, name: true, imageUrl: true } },
    },
  });

  const dailyTimeline = recentDraws.map((d) => ({
    date: d.date,
    archetype: d.primaryArchetype,
  }));

  // Карты Путника
  const pathTimeline: { date: Date; archetype: NonNullable<(typeof draws)[number]["pathArchetype"]> }[] = [];
  for (const draw of draws) {
    if (draw.pathArchetype) {
      pathTimeline.push({ date: draw.date, archetype: draw.pathArchetype });
    }
  }

  return {
    windowDays: WINDOW_DAYS,
    totalDraws: draws.length,
    topArchetypes,
    sphereTrends,
    dailyTimeline,
    pathTimeline,
  };
}

// ── LLM: описание «До / Сейчас» для карты Путника ──

export async function generatePathInsight(params: {
  pathCard: { name: string; essence: string; tagline: string };
  beforeCards: { name: string; tagline: string }[];
}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return fallbackInsight(params.pathCard, params.beforeCards);

  const beforeList = params.beforeCards.map((c) => `«${c.name}» — ${c.tagline}`).join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Yasen Khren",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        temperature: 0.7,
        reasoning: { enabled: false },
        messages: [
          {
            role: "system",
            content: `Ты — аналитик архетипических карт в игре «Ясен Хрен». Человек вытягивает карту дня каждый день. Раз в неделю выпадает «Карта Путника» — она показывает, какой путь человек проходит сейчас.

Твоя задача: написать короткий анализ (3-4 предложения) в стиле архетипических карт.

Формат:
<b>До:</b> одна фраза — какие архетипы были в последние дни и что это говорит о состоянии человека. Без перечисления имён — обобщи суть.
<b>Сейчас:</b> одна-две фразы — что значит выпавшая карта Путника, учитывая пройденный путь.

Правила:
- Стиль: прямой, без воды, как в описаниях самих карт.
- Не используй слово «архетип» — говори о человеке напрямую.
- Обращайся на «ты».
- HTML: <b>До:</b> и <b>Сейчас:</b> жирным.
- Только текст, без пояснений и вступления.`,
          },
          {
            role: "user",
            content: `Карта Путника: «${params.pathCard.name}» — ${params.pathCard.tagline}. ${params.pathCard.essence}

Карты, выпавшие до неё:
${beforeList || "нет данных"}

Напиши анализ "До / Сейчас".`,
          },
        ],
      }),
    });

    clearTimeout(timeout);

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? fallbackInsight(params.pathCard, params.beforeCards);
  } catch {
    return fallbackInsight(params.pathCard, params.beforeCards);
  }
}

function fallbackInsight(
  pathCard: { name: string; essence: string },
  beforeCards: { name: string }[],
): string {
  const beforeNames = beforeCards.slice(0, 5).map((c) => `«${c.name}»`).join(" · ") || "пока без карт";
  return `<b>До:</b> Твой путь проходил через ${beforeNames}.\n<b>Сейчас:</b> «${pathCard.name}» — ${pathCard.essence}`;
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
