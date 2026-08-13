import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const DEMO_EMAIL = "demo@yasenhren.ru";
const DEMO_PASSWORD = "YasenDemo2026";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function dateDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: "Демо-доступ",
      passwordHash,
      tariff: "PREMIUM",
      tariffExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdAt: dateDaysAgo(14),
    },
    update: {
      // Демо-доступ должен быть всегда воспроизводимым: при повторном запуске
      // восстанавливаем и пароль, а не только тариф.
      passwordHash,
      tariff: "PREMIUM",
      tariffExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Удаляем старые карты дня, чтобы пересоздать с PATH
  await prisma.dailyDraw.deleteMany({ where: { userId: user.id } });

  const primaryPool = await prisma.archetype.findMany({
    where: { family: { in: ["LIGHT", "SHADOW", "LIMINAL"] } },
    orderBy: { id: "asc" },
  });

  const pathPool = await prisma.archetype.findMany({
    where: { family: "PATH" },
    orderBy: { id: "asc" },
  });

  const daysWithPath = new Set([0, 3]);

  for (let i = 0; i < 5; i++) {
    const date = dateDaysAgo(4 - i);
    const pathArchetypeId = daysWithPath.has(i) ? pickRandom(pathPool).id : undefined;

    await prisma.dailyDraw.create({
      data: {
        userId: user.id,
        date,
        primaryArchetypeId: pickRandom(primaryPool).id,
        pathArchetypeId,
        channel: "WEB",
      },
    });
  }

  console.log("Демо-аккаунт готов:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  пароль:   ${DEMO_PASSWORD}`);
  console.log(`  тариф:    PREMIUM`);
  console.log(`  история:  5 дней карт (PRIMARY), 2 дня с PATH`);
  console.log(`  created:  14 дней назад`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
