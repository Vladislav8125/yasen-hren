import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embeddings";

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
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vectorLiteral,
    topK,
  );
}

export async function askAssistant(query: string): Promise<AssistantAnswer> {
  const exact = await findExactMatch(query);
  if (exact) return exact;

  if (!process.env.VOYAGE_API_KEY || !process.env.OPENROUTER_API_KEY) {
    return {
      mode: "unavailable",
      text: "Не нашла точного совпадения, а смысловой поиск пока не подключён (нет ключей эмбеддингов/ИИ). Попробуйте спросить конкретное название карты или термина.",
    };
  }

  const chunks = await semanticSearch(query);
  if (chunks.length === 0) {
    return { mode: "unavailable", text: "В базе знаний пока пусто — ничего не нашла." };
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] (${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}) ${c.content}`)
    .join("\n\n");

  const text = await completeViaOpenRouter(context, query);

  return {
    mode: "rag",
    text,
    sources: chunks.map((c) => `${c.sourceType}${c.sourceId ? `: ${c.sourceId}` : ""}`),
  };
}

async function completeViaOpenRouter(context: string, query: string): Promise<string> {
  const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Ясен Хрен",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      // Без этого модель на OpenRouter по умолчанию включает extended
      // thinking и может истратить весь max_tokens на рассуждения, вернув
      // пустой content (проверено вживую 2026-07-26 — с reasoning
      // включённым content был null при том же лимите токенов).
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
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter completion failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}
