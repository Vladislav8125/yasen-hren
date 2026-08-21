import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embedTexts } from "../src/lib/embeddings";
import { knowledgeChunks, knowledgeDocumentChunks } from "./knowledge-data";
import { isOpenRouterConfigured } from "../src/lib/openrouter";

// Индексация базы знаний для RAG — архитектурное ТЗ раздел 7.
// Требует OPENROUTER_API_KEY (эмбеддинги считаются один раз при заливке
// контента, не на каждый вопрос пользователя). Запуск: pnpm tsx -r dotenv/config prisma/ingest-knowledge.ts
//
// Контент отправляется пакетами, чтобы сократить число API-запросов. Все
// векторы рассчитываются до изменения БД, затем индекс заменяется одной
// транзакцией — старые и новые пространства эмбеддингов не смешиваются.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface PendingChunk {
  sourceType: string;
  sourceId: string;
  content: string;
}

async function createVectors(chunks: PendingChunk[]) {
  // Векторы получаем до изменения БД: ошибка внешнего API не уничтожит уже
  // работающий индекс.
  const vectors: number[][] = [];
  for (let index = 0; index < chunks.length; index += 128) {
    const batch = chunks.slice(index, index + 128);
    console.log(`Эмбеддинги ${index + 1}–${index + batch.length} из ${chunks.length}...`);
    vectors.push(...await embedTexts(batch.map((chunk) => chunk.content)));
  }
  return vectors;
}

async function replaceChunks(chunks: PendingChunk[], vectors: number[][]) {
  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({});
    for (let i = 0; i < chunks.length; i++) {
      const vectorLiteral = `[${vectors[i].join(",")}]`;
      await tx.$executeRawUnsafe(
        `INSERT INTO "KnowledgeChunk" (id, "sourceType", "sourceId", content, embedding)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector)`,
        chunks[i].sourceType,
        chunks[i].sourceId,
        chunks[i].content,
        vectorLiteral,
      );
    }
  });
}

async function main() {
  if (!isOpenRouterConfigured()) {
    console.error("OpenRouter не настроен — индексация невозможна. См. .env.example.");
    process.exit(1);
  }

  const pending: PendingChunk[] = [...knowledgeChunks, ...knowledgeDocumentChunks].map((c) => ({
    sourceType: c.sourceType,
    sourceId: c.sourceId,
    content: c.content,
  }));

  // Имя + архетип + свойство добавлены 2026-07-27: раньше индексировались
  // только essence/function/inLife, из-за чего вопросы про имя карты или
  // упомянутую в archetypeType сущность (например "Мать Анахуа" — она
  // сама отдельная карта, но встречается ещё и как фраза в archetypeType
  // других карт) не находились в семантическом поиске.
  const archetypes = await prisma.archetype.findMany();
  for (const a of archetypes) {
    const content = [a.name, a.archetypeType, a.property, a.essence, a.function, a.inLife]
      .filter(Boolean)
      .join(" ");
    pending.push({ sourceType: "card", sourceId: a.name, content });
  }

  const terms = await prisma.glossaryTerm.findMany({ where: { status: "approved" } });
  for (const t of terms) {
    pending.push({ sourceType: "glossary", sourceId: t.term, content: `${t.term}: ${t.definition}` });
  }

  console.log(`Индексирую ${pending.length} кусков через OpenRouter...`);
  const vectors = await createVectors(pending);
  console.log("Заменяю индекс одной транзакцией...");
  await replaceChunks(pending, vectors);

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
