import { timingSafeEqual } from "node:crypto";

const MAX_REQUEST_BYTES = 2_000_000;
const MAX_EMBEDDING_INPUTS = 128;
const MAX_EMBEDDING_CHARS = 500_000;

type ProxyRequest = {
  endpoint?: unknown;
  payload?: unknown;
};

function isAuthorized(request: Request, expectedSecret: string): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(expectedSecret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function embeddingPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const input = (payload as { input?: unknown }).input;
  const texts = typeof input === "string" ? [input] : input;
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_EMBEDDING_INPUTS) return null;
  if (!texts.every((text) => typeof text === "string" && text.length > 0)) return null;
  if (texts.reduce((total, text) => total + text.length, 0) > MAX_EMBEDDING_CHARS) return null;

  return {
    input,
    model: process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-large",
    dimensions: 1024,
    encoding_format: "float",
  };
}

function chatPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const messages = (payload as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) return null;

  const maxTokens = Number((payload as { max_tokens?: unknown }).max_tokens ?? 600);
  if (!Number.isFinite(maxTokens) || maxTokens < 1) return null;

  return {
    model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5",
    max_tokens: Math.min(Math.floor(maxTokens), 600),
    reasoning: { enabled: false },
    messages,
  };
}

export async function POST(request: Request) {
  const proxySecret = process.env.OPENROUTER_PROXY_SECRET;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!proxySecret || proxySecret.length < 32 || !apiKey) {
    return Response.json({ error: "AI gateway is not configured" }, { status: 503 });
  }
  if (!isAuthorized(request, proxySecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request is too large" }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Request is too large" }, { status: 413 });
  }

  let body: ProxyRequest;
  try {
    body = JSON.parse(rawBody) as ProxyRequest;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const payload = endpoint === "embeddings"
    ? embeddingPayload(body.payload)
    : endpoint === "chat/completions"
      ? chatPayload(body.payload)
      : null;
  if (!payload || (endpoint !== "embeddings" && endpoint !== "chat/completions")) {
    return Response.json({ error: "Unsupported or invalid request" }, { status: 400 });
  }

  const upstream = await fetch(`https://openrouter.ai/api/v1/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "https://yasenhren.ru",
      "X-Title": "Yasen Khren",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
