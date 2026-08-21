import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embeddings";
import { ALL_KNOWLEDGE_DOCUMENTS } from "@/data/knowledge";
import { fetchOpenRouter, isOpenRouterConfigured } from "@/lib/openrouter";

// RAG-ассистент — архитектурное ТЗ, раздел 7. Два режима:
// 1. Дословный — точное совпадение с термином глоссария/картой, ответ
//    как есть, без LLM. Дёшево и без риска исказить смысл.
// 2. RAG — семантический поиск по KnowledgeChunk (pgvector) + LLM
//    отвечает только на основе найденных кусков, с указанием источника.
//
// Комплишн — через OpenRouter (OpenAI-совместимый REST API), не напрямую
// через Anthropic SDK: у владельца уже есть ключ OpenRouter (используется
// и в других проектах Steps), отдельный ANTHROPIC_API_KEY не нужен.

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
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vectorLiteral,
    topK,
  );
}

type KnowledgeResult = { id: string; sourceType: string; sourceId: string | null; content: string; distance: number };

/**
 * Резервный поиск нужен, когда внешний провайдер векторов недоступен
 * (например, заблокировал IP VPS). Он не заменяет семантический поиск, но
 * сохраняет работающий ассистент по уже загруженной базе знаний.
 */
async function keywordFallbackSearch(query: string, topK = 5): Promise<KnowledgeResult[]> {
  const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}-]{3,}/gu) ?? [])];
  if (terms.length === 0) return [];
  const score = (content: string) => {
    const normalized = content.toLowerCase();
    return terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
  };

  const documentMatches = ALL_KNOWLEDGE_DOCUMENTS.flatMap((document) =>
    document.paragraphs.map((paragraph, index) => ({
      id: `document:${document.slug}:${index}`,
      sourceType: "document",
      sourceId: `${document.slug}:${index + 1}`,
      content: `${document.title}\n${paragraph}`,
      distance: score(`${document.title}\n${paragraph}`),
    })),
  );
  const [archetypes, glossary] = await Promise.all([
    prisma.archetype.findMany(),
    prisma.glossaryTerm.findMany({ where: { status: "approved" } }),
  ]);
  const dynamicMatches: KnowledgeResult[] = [
    ...archetypes.map((card) => {
      const content = [card.name, card.tagline, card.property, card.essence, card.function, card.inLife, card.ritual, card.cardQuestion]
        .filter(Boolean).join("\n");
      return { id: `card:${card.id}`, sourceType: "card", sourceId: card.name, content, distance: score(content) };
    }),
    ...glossary.map((term) => ({
      id: `glossary:${term.id}`, sourceType: "glossary", sourceId: term.term,
      content: `${term.term}: ${term.definition}`, distance: score(`${term.term}: ${term.definition}`),
    })),
  ];
  return [...documentMatches, ...dynamicMatches]
    .filter((result) => result.distance > 0)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, topK)
    .map((result) => ({ ...result, distance: 1 / result.distance }));
}

export async function askAssistant(query: string): Promise<AssistantAnswer> {
  const exact = await findExactMatch(query);
  if (exact) return exact;

  if (!isOpenRouterConfigured()) {
    return {
      mode: "unavailable",
      text: "Не нашла точного совпадения, а смысловой поиск пока не подключён (нет ключа ИИ). Попробуйте спросить конкретное название карты или термина.",
    };
  }

  let chunks: KnowledgeResult[];
  try {
    chunks = await semanticSearch(query);
  } catch (error) {
    console.error("Semantic search failed", error);
    chunks = await keywordFallbackSearch(query);
  }
  if (chunks.length === 0) chunks = await keywordFallbackSearch(query);
  if (chunks.length === 0) {
    return { mode: "unavailable", text: "Не нашла подходящих материалов в базе знаний. Попробуйте назвать карту, термин или описать вопрос другими словами." };
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}) ${c.content}`)
    .join("\n\n");

  let text: string;
  try {
    text = await completeViaOpenRouter(context, query);
  } catch (error) {
    console.error("RAG completion failed", error);
    return { mode: "unavailable", text: "Источники нашлись, но ИИ-ответ временно недоступен. Попробуйте ещё раз немного позже." };
  }

  return {
    mode: "rag",
    text,
    sources: chunks.map((c) => `${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}`),
  };
}

async function completeViaOpenRouter(context: string, query: string): Promise<string> {
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5";

  const response = await fetchOpenRouter("chat/completions", {
    model,
    max_tokens: 600,
    reasoning: { enabled: false },
    messages: [
      {
        role: "system",
        content:
          "Ты — ассистент приложения «Ясен Хрен» (архетипические карты психологической гигиены). " +
          "Отвечай ТОЛЬКО на основе предоставленных источников ниже, ничего не выдумывай. " +
          "Если ответа в источниках нет — прямо скажи, что не знаешь. Отвечай кратко, по-русски, тепло, без канцелярита.",
      },
      { role: "user", content: `Источники:\n${context}\n\nВопрос: ${query}` },
    ],
  });

  if (!response.ok) {
    throw new Error(`OpenRouter completion failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned an empty answer");
  return content;
}
