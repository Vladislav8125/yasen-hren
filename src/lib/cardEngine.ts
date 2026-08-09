import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Archetype, CardFamily, DeliveryChannel, LifeSphere } from "@/generated/prisma/client";
import { effectiveTariff } from "@/lib/access";

// Карточный движок — plans/2026-07-25-yasen-hren-tz-architecture.md, раздел 5.
//
// Детерминированный "рандом": карта дня вычисляется из userId+даты, а не
// сохраняется "кто первый спросил" — так веб и бот в один день видят одну
// и ту же карту. Anti-repeat не даёт повторить карту, которая выпадала
// последние ANTI_REPEAT_DAYS дней (пока хватает карт в колоде).
//
// Путь Путника выдаётся один раз в календарную неделю на активных платных
// тарифах. В ежедневную колоду PATH не входит.

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

function utcWeekStart(date: Date): Date {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + mondayOffset);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function utcNextWeek(date: Date): Date {
  const next = utcWeekStart(date);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

async function matrixLightAlly(archetype: Archetype): Promise<Archetype | null> {
  if (archetype.family !== "SHADOW") return null;
  if (archetype.lightAllyId) {
    return prisma.archetype.findUnique({ where: { id: archetype.lightAllyId } });
  }
  if (!archetype.lightAllyName) return null;
  return prisma.archetype.findFirst({
    where: { family: "LIGHT", name: { equals: archetype.lightAllyName, mode: "insensitive" } },
  });
}

async function weeklyPathFor(userId: string, date: Date, user: { tariff: "FREE" | "STANDARD" | "PREMIUM"; tariffExpiresAt: Date | null }) {
  if (effectiveTariff(user) === "FREE") return null;
  const weekStart = utcWeekStart(date);
  const weekEnd = utcNextWeek(date);
  const alreadyIssued = await prisma.dailyDraw.findFirst({
    where: { userId, date: { gte: weekStart, lt: weekEnd }, pathArchetypeId: { not: null } },
    select: { pathArchetypeId: true },
  });
  if (alreadyIssued) return null;

  const pathPool = await prisma.archetype.findMany({ where: { family: "PATH" }, orderBy: { id: "asc" } });
  if (pathPool.length === 0) return null;
  const weekKey = weekStart.toISOString().slice(0, 10);
  return pathPool[seededIndex(`${userId}:path:${weekKey}`, pathPool.length)].id;
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
  const user = await prisma.user.findUniqueOrThrow({ where: { id: options.userId } });
  if (existing) {
    if (!existing.pathArchetypeId) {
      const weeklyPathId = await weeklyPathFor(options.userId, date, user);
      if (weeklyPathId) {
        return prisma.dailyDraw.update({
          where: { id: existing.id },
          data: { pathArchetypeId: weeklyPathId },
          include: { primaryArchetype: true, secondaryArchetype: true, pathArchetype: true },
        });
      }
    }
    return existing;
  }
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
    const matrixAlly = await matrixLightAlly(primary);
    if (matrixAlly) {
      secondary = matrixAlly;
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

  const pathArchetypeId = await weeklyPathFor(options.userId, date, user);

  return prisma.dailyDraw.create({
    data: {
      userId: options.userId,
      date,
      primaryArchetypeId: primary.id,
      secondaryArchetypeId: secondaryId,
    pathArchetypeId: pathArchetypeId ?? undefined,
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
  const matrixAlly = await matrixLightAlly(draw.primaryArchetype);
  if (matrixAlly) {
    secondary = matrixAlly;
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
