import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embeddings";

// RAG-ассистент — архитектурное ТЗ, раздел 7. Два режима:
// 1. Дословный — точное совпадение с термином глоссария/картой, ответ
//    как есть, без LLM. Дёшево и без риска исказить смысл.
// 2. RAG — семантический поиск по KnowledgeChunk (pgvector) + Claude
//    отвечает только на основе найденных кусков, с указанием источника.

export interface AssistantAnswer {
  mode: "literal" | "rag" | "unavailable";
  text: string;
  source?: string;
  sources?: string[];
}

async function findExactMatch(query: string): Promise<AssistantAnswer | null> {
  const normalized = query.trim().toLowerCase();

  const archetype = await prisma.archetype.findFirst({
    where: { name: { equals: normalized, mode: "insensitive" } },
  });
  if (archetype) {
    return {
      mode: "literal",
      text: `${archetype.property ?? ""}\n\n${archetype.essence}`.trim(),
      source: `Карта → ${archetype.name}`,
    };
  }

  const term = await prisma.glossaryTerm.findFirst({
    where: { status: "approved", term: { equals: normalized, mode: "insensitive" } },
  });
  if (term) {
    return { mode: "literal", text: term.definition, source: `Глоссарий → ${term.term}` };
  }

  return null;
}

async function semanticSearch(query: string, topK = 5) {
  const vector = await embedText(query);
  const vectorLiteral = `[${vector.join(",")}]`;

  return prisma.$queryRawUnsafe<
    { id: string; sourceType: string; sourceId: string | null; content: string; distance: number }[]
  >(
    `SELECT id, "sourceType", "sourceId", content, embedding <=> $1::vector AS distance
     FROM "KnowledgeChunk"
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vectorLiteral,
    topK,
  );
}

export async function askAssistant(query: string): Promise<AssistantAnswer> {
  const exact = await findExactMatch(query);
  if (exact) return exact;

  if (!process.env.VOYAGE_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return {
      mode: "unavailable",
      text: "Не нашла точного совпадения, а смысловой поиск пока не подключён (нет ключей эмбеддингов/ИИ). Попробуйте спросить конкретное название карты или термина.",
    };
  }

  const chunks = await semanticSearch(query);
  if (chunks.length === 0) {
    return { mode: "unavailable", text: "В базе знаний пока пусто — ничего не нашла." };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}) ${c.content}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system:
      "Ты — ассистент приложения «Ясен Хрен» (архетипические карты психологической гигиены). " +
      "Отвечай ТОЛЬКО на основе предоставленных источников ниже, ничего не выдумывай. " +
      "Если ответа в источниках нет — прямо скажи, что не знаешь. Отвечай кратко, по-русски, тепло, без канцелярита.",
    messages: [
      {
        role: "user",
        content: `Источники:\n${context}\n\nВопрос: ${query}`,
      },
    ],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

  return {
    mode: "rag",
    text,
    sources: chunks.map((c) => `${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}`),
  };
}
