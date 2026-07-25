import { createHmac } from "crypto";

// Привязка Telegram-аккаунта — архитектурное ТЗ, раздел 10: пользователь
// жмёт «Привязать Telegram» в кабинете → получает t.me/bot?start=<токен> →
// бот при /start <token> находит пользователя и записывает telegramChatId.
//
// Токен стейтлес (HMAC на AUTH_SECRET, 15 минут) — не нужна отдельная
// таблица токенов в БД, подделать без секрета нельзя, срок жизни короткий.

const TOKEN_TTL_MS = 15 * 60 * 1000;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET не задан");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 16);
}

export function createTelegramLinkToken(userId: string): string {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${expiry}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyTelegramLinkToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userId, expiryStr, sig] = decoded.split(".");
    if (!userId || !expiryStr || !sig) return null;
    if (Date.now() > Number(expiryStr)) return null;
    if (sig !== sign(`${userId}.${expiryStr}`)) return null;
    return userId;
  } catch {
    return null;
  }
}
