import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { embedTexts } from "../src/lib/embeddings";
import { knowledgeChunks } from "./knowledge-data";

// Индексация базы знаний для RAG — архитектурное ТЗ раздел 7.
// Требует VOYAGE_API_KEY (эмбеддинги считаются один раз при заливке
// контента, не на каждый вопрос пользователя). Запуск: pnpm tsx -r dotenv/config prisma/ingest-knowledge.ts
//
// Без оплаты на аккаунте Voyage — лимит 3 запроса/мин, поэтому весь
// контент собирается в один список и эмбеддится ОДНИМ batch-запросом
// (embedTexts), а не по одному чанку — иначе гарантированный 429 уже на
// 4-м куске (проверено вживую 2026-07-26).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface PendingChunk {
  sourceType: string;
  sourceId: string;
  content: string;
}

async function insertChunks(chunks: PendingChunk[]) {
  const vectors = await embedTexts(chunks.map((c) => c.content));

  for (let i = 0; i < chunks.length; i++) {
    const vectorLiteral = `[${vectors[i].join(",")}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" (id, "sourceType", "sourceId", content, embedding)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector)`,
      chunks[i].sourceType,
      chunks[i].sourceId,
      chunks[i].content,
      vectorLiteral,
    );
  }
}

async function main() {
  if (!process.env.VOYAGE_API_KEY) {
    console.error("VOYAGE_API_KEY не задан — индексация невозможна. См. .env.example.");
    process.exit(1);
  }

  console.log("Очищаю старые эмбеддинги...");
  await prisma.knowledgeChunk.deleteMany({});

  const pending: PendingChunk[] = knowledgeChunks.map((c) => ({
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

  console.log(`Индексирую ${pending.length} кусков одним batch-запросом к Voyage...`);
  await insertChunks(pending);

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
