import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embedText } from "../src/lib/embeddings";
import { knowledgeChunks } from "./knowledge-data";

// Индексация базы знаний для RAG — архитектурное ТЗ раздел 7.
// Требует VOYAGE_API_KEY (эмбеддинги считаются один раз при заливке
// контента, не на каждый вопрос пользователя). Запуск: pnpm tsx prisma/ingest-knowledge.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function insertChunk(sourceType: string, sourceId: string, content: string) {
  const vector = await embedText(content);
  const vectorLiteral = `[${vector.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO "KnowledgeChunk" (id, "sourceType", "sourceId", content, embedding)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector)`,
    sourceType,
    sourceId,
    content,
    vectorLiteral,
  );
}

async function main() {
  if (!process.env.VOYAGE_API_KEY) {
    console.error("VOYAGE_API_KEY не задан — индексация невозможна. См. .env.example.");
    process.exit(1);
  }

  console.log("Очищаю старые эмбеддинги...");
  await prisma.knowledgeChunk.deleteMany({});

  console.log(`Индексирую ${knowledgeChunks.length} кусков методологии...`);
  for (const chunk of knowledgeChunks) {
    await insertChunk(chunk.sourceType, chunk.sourceId, chunk.content);
  }

  console.log("Индексирую карты (Суть + Функция + В жизни)...");
  const archetypes = await prisma.archetype.findMany();
  for (const a of archetypes) {
    const content = [a.essence, a.function, a.inLife].filter(Boolean).join(" ");
    await insertChunk("card", a.name, content);
  }

  console.log("Индексирую одобренные термины глоссария...");
  const terms = await prisma.glossaryTerm.findMany({ where: { status: "approved" } });
  for (const t of terms) {
    await insertChunk("glossary", t.term, `${t.term}: ${t.definition}`);
  }

  const total = await prisma.knowledgeChunk.count();
  console.log(`Готово: ${total} кусков в базе знаний.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
