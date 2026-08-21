export type OpenRouterEndpoint = "embeddings" | "chat/completions";

export function isOpenRouterConfigured(): boolean {
  const proxyUrl = process.env.OPENROUTER_PROXY_URL?.trim();
  if (proxyUrl) return Boolean(process.env.OPENROUTER_PROXY_SECRET);
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function fetchOpenRouter(endpoint: OpenRouterEndpoint, payload: unknown): Promise<Response> {
  const proxyUrl = process.env.OPENROUTER_PROXY_URL?.trim();
  if (proxyUrl) {
    const proxySecret = process.env.OPENROUTER_PROXY_SECRET;
    if (!proxySecret) {
      throw new Error("OPENROUTER_PROXY_SECRET не задан для внутреннего AI-шлюза.");
    }

    return fetch(proxyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${proxySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint, payload }),
      cache: "no-store",
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY не задан.");
  }

  return fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Yasen Khren",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
