import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Демо-аккаунт для показа приложения владельцу/стейкхолдерам — Premium
// (видно всё: 2-я карта, полное «Зеркало», доступ к консультациям) с
// историей карт за последние 10 дней, чтобы «Зеркало» не было пустым.
// Запуск: pnpm tsx prisma/seed-demo.ts

const DEMO_EMAIL = "demo@yasenhren.ru";
const DEMO_PASSWORD = "YasenDemo2026";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function dateDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
    },
    update: {
      tariff: "PREMIUM",
      tariffExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const pool = await prisma.archetype.findMany({
    where: { family: { in: ["LIGHT", "SHADOW", "LIMINAL"] } },
    orderBy: { id: "asc" },
  });

  // Намеренные повторы одних и тех же карт в разные дни — чтобы "Топ
  // архетипов" в Зеркале показывал реальную картину, а не 10 разных карт.
  const primaryPattern = [0, 1, 0, 2, 1, 0, 3, 2, 1, 0];
  const secondaryPattern = [4, 5, 4, 6, 5, 4, 7, 6, 5, 4];

  for (let i = 0; i < 10; i++) {
    const date = dateDaysAgo(9 - i); // от старой к today
    await prisma.dailyDraw.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: {
        userId: user.id,
        date,
        primaryArchetypeId: pool[primaryPattern[i] % pool.length].id,
        secondaryArchetypeId: pool[secondaryPattern[i] % pool.length].id,
        channel: "WEB",
      },
      update: {},
    });
  }

  console.log("Демо-аккаунт готов:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  пароль:   ${DEMO_PASSWORD}`);
  console.log(`  тариф:    PREMIUM`);
  console.log(`  история:  10 дней карт (для "Зеркала")`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
