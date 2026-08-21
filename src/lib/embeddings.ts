// Эмбеддинги для RAG через OpenRouter. Одна модель используется и для
// документов, и для запросов: векторы разных моделей нельзя смешивать.
// Размерность фиксирована схемой pgvector и должна оставаться равной 1024.
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1024;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!isOpenRouterConfigured()) {
    throw new Error("OpenRouter не настроен — семантический поиск пока недоступен (см. .env.example).");
  }

  const response = await fetchOpenRouter("embeddings", {
    input: texts,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    encoding_format: "float",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter embeddings failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { data?: { embedding: number[]; index: number }[] };
  const vectors = [...(data.data ?? [])].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  if (vectors.length !== texts.length || vectors.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)) {
    throw new Error("OpenRouter вернул некорректное число или размер эмбеддингов.");
  }
  return vectors;
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
import { fetchOpenRouter, isOpenRouterConfigured } from "@/lib/openrouter";
