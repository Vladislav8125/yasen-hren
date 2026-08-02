import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Archetype, CardFamily, DeliveryChannel, LifeSphere, Tariff } from "@/generated/prisma/client";

// Карточный движок — plans/2026-07-25-yasen-hren-tz-architecture.md, раздел 5.
//
// Детерминированный "рандом": карта дня вычисляется из userId+даты, а не
// сохраняется "кто первый спросил" — так веб и бот в один день видят одну
// и ту же карту. Anti-repeat не даёт повторить карту, которая выпадала
// последние ANTI_REPEAT_DAYS дней (пока хватает карт в колоде).
//
// Путь Путника (family=PATH) в ежедневную раздачу не входит — решение
// владельца 2026-07-25, это отдельный трек в «Зеркале».

const ANTI_REPEAT_DAYS = 7;
const DAILY_POOL_FAMILIES: CardFamily[] = ["LIGHT", "SHADOW", "LIMINAL"];

function seededIndex(seed: string, length: number): number {
  const hash = createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0) % length;
}

function todayDateOnly(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function recentArchetypeIds(userId: string, days: number): Promise<Set<string>> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const draws = await prisma.dailyDraw.findMany({
    where: { userId, date: { gte: since } },
    select: { primaryArchetypeId: true, secondaryArchetypeId: true },
  });

  const ids = new Set<string>();
  for (const draw of draws) {
    ids.add(draw.primaryArchetypeId);
    if (draw.secondaryArchetypeId) ids.add(draw.secondaryArchetypeId);
  }
  return ids;
}

async function pickArchetype(params: {
  seed: string;
  excludeIds: Set<string>;
  sphere?: LifeSphere;
  families?: CardFamily[];
}): Promise<Archetype> {
  const baseWhere = { family: { in: params.families ?? DAILY_POOL_FAMILIES } };
  const pool = await prisma.archetype.findMany({
    where: params.sphere ? { ...baseWhere, spheres: { has: params.sphere } } : baseWhere,
    orderBy: { id: "asc" },
  });

  // Пул после фильтра по сфере может быть пустым или слишком узким —
  // тогда падаем сначала обратно на общий пул (без сферы), а не оставляем
  // пользователя без карты.
  const candidates = pool.length > 0 ? pool : await prisma.archetype.findMany({ where: baseWhere, orderBy: { id: "asc" } });

  const withoutRecent = candidates.filter((a) => !params.excludeIds.has(a.id));
  const finalPool = withoutRecent.length > 0 ? withoutRecent : candidates;

  const index = seededIndex(params.seed, finalPool.length);
  return finalPool[index];
}

export type SecondaryMode = "random" | "sphere";

export interface DrawOptions {
  userId: string;
  channel: DeliveryChannel;
  wantsSecondary: boolean; // Premium — 2-я карта
  secondaryMode?: SecondaryMode;
  sphere?: LifeSphere;
}

export async function getOrCreateDailyDraw(options: DrawOptions) {
  const date = todayDateOnly();

  const existing = await prisma.dailyDraw.findUnique({
    where: { userId_date: { userId: options.userId, date } },
    include: { primaryArchetype: true, secondaryArchetype: true, pathArchetype: true },
  });
  if (existing) return existing;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: options.userId } });
  const dateStr = date.toISOString().slice(0, 10);
  const excludeIds = await recentArchetypeIds(options.userId, ANTI_REPEAT_DAYS);

  const primary = await pickArchetype({
    seed: `${options.userId}:${dateStr}:primary`,
    excludeIds,
  });

  let secondaryId: string | undefined;
  let sphereRequested: LifeSphere | undefined;

  if (options.wantsSecondary) {
    const excludeForSecondary = new Set(excludeIds);
    excludeForSecondary.add(primary.id);
    sphereRequested = options.secondaryMode === "sphere" ? options.sphere : undefined;

    let secondary: Archetype;
    if (primary.family === "SHADOW" && primary.lightAllyId) {
      secondary = await prisma.archetype.findUniqueOrThrow({ where: { id: primary.lightAllyId } });
    } else {
      secondary = await pickArchetype({
        seed: `${options.userId}:${dateStr}:secondary`,
        excludeIds: excludeForSecondary,
        sphere: sphereRequested,
        families: ["LIGHT"],
      });
    }
    secondaryId = secondary.id;
  }

  // Карта Путника — раз в 7 дней (Standard/Premium). Free не получает.
  let pathArchetypeId: string | undefined;
  const daysSinceCreation = Math.floor((date.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation >= 0 && (daysSinceCreation % 7 === 0) && user.tariff !== "FREE") {
    const pathPool = await prisma.archetype.findMany({
      where: { family: "PATH" },
      orderBy: { id: "asc" },
    });
    if (pathPool.length > 0) {
      const idx = seededIndex(`${options.userId}:${dateStr}:path`, pathPool.length);
      pathArchetypeId = pathPool[idx].id;
    }
  }

  return prisma.dailyDraw.create({
    data: {
      userId: options.userId,
      date,
      primaryArchetypeId: primary.id,
      secondaryArchetypeId: secondaryId,
      pathArchetypeId,
      sphereRequested,
      channel: options.channel,
    },
    include: { primaryArchetype: true, secondaryArchetype: true, pathArchetype: true },
  });
}

export async function addSecondaryCard(options: {
  userId: string;
  secondaryMode?: SecondaryMode;
  sphere?: LifeSphere;
}) {
  const date = todayDateOnly();
  const draw = await prisma.dailyDraw.findUniqueOrThrow({
    where: { userId_date: { userId: options.userId, date } },
    include: { primaryArchetype: true },
  });

  if (draw.secondaryArchetypeId) {
    return draw as typeof draw & { secondaryArchetype: Archetype };
  }

  const dateStr = date.toISOString().slice(0, 10);
  const excludeIds = await recentArchetypeIds(options.userId, ANTI_REPEAT_DAYS);
  excludeIds.add(draw.primaryArchetypeId);

  const sphereRequested = options.secondaryMode === "sphere" ? options.sphere : undefined;

  let secondary: Archetype;
  if (draw.primaryArchetype.family === "SHADOW" && draw.primaryArchetype.lightAllyId) {
    secondary = await prisma.archetype.findUniqueOrThrow({ where: { id: draw.primaryArchetype.lightAllyId } });
  } else {
    secondary = await pickArchetype({
      seed: `${options.userId}:${dateStr}:secondary`,
      excludeIds,
      sphere: sphereRequested,
      families: ["LIGHT"],
    });
  }

  return prisma.dailyDraw.update({
    where: { id: draw.id },
    data: { secondaryArchetypeId: secondary.id, sphereRequested },
    include: { primaryArchetype: true, secondaryArchetype: true, pathArchetype: true },
  });
}
