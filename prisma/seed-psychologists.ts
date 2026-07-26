import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Плейсхолдер-профили психологов для табло выбора в Магазине (Фаза D
// редизайна) — владелец явно попросил "поставь пока двух рандомных
// с регалиями (рандом)" до получения реальных профилей. Запуск:
// pnpm tsx prisma/seed-psychologists.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const psychologists = [
  {
    name: "Анна Светлова",
    credentials: "Психолог, гештальт-терапевт · стаж 12 лет · тревожность, выгорание",
  },
  {
    name: "Дмитрий Ковалёв",
    credentials: "Клинический психолог, КПТ-терапевт · стаж 8 лет · кризисные состояния, самооценка",
  },
];

async function main() {
  const existing = await prisma.psychologist.count();
  if (existing > 0) {
    console.log(`Уже есть ${existing} профилей — пропускаю (не дублирую).`);
    return;
  }

  for (const p of psychologists) {
    await prisma.psychologist.create({ data: p });
  }
  console.log(`Создано ${psychologists.length} плейсхолдер-профилей психологов.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
