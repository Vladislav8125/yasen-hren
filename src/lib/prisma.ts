import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 больше не читает DATABASE_URL из schema.prisma сама —
// строка подключения передаётся явно через adapter (см. диагностику при
// первой попытке оставить url в datasource). Один клиент на процесс,
// чтобы в dev-режиме (hot reload) не плодить новые соединения с базой.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
