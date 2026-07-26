// Эмбеддинги для RAG — архитектурное ТЗ, раздел 7. Anthropic не выпускает
// свою embeddings-модель, поэтому используем Voyage AI — официально
// рекомендованный партнёр Anthropic для эмбеддингов.

// voyage-3.5 устарела и не входит в бесплатный лимит токенов (проверено
// 2026-07-26) — voyage-4 при том же дефолтном output_dimension=1024
// (схема БД не меняется) даёт 200M бесплатных токенов на аккаунт.
const VOYAGE_MODEL = process.env.VOYAGE_EMBEDDING_MODEL ?? "voyage-4";

// Без привязанного способа оплаты аккаунт Voyage ограничен 3 запросами в
// минуту (проверено 2026-07-26 — реальный 429 при поштучной индексации
// базы знаний). embedTexts принимает массив и одним запросом получает все
// векторы разом (Voyage поддерживает batch input) — единственный способ
// проиндексировать десятки кусков контента, не упираясь в лимит.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY не задан — семантический поиск пока недоступен (см. .env.example).");
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage embeddings failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { data: { embedding: number[]; index: number }[] };
  return [...data.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
