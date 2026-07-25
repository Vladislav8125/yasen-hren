import { createHmac } from "crypto";

// Привязка VK-аккаунта — архитектурное ТЗ, раздел 10. VK не поддерживает
// диплинки уровня Telegram (`?start=`), поэтому пользователь получает
// vk.com/im?sel=-<group_id>&text=<токен> — открывается диалог с сообществом
// с уже подставленным текстом, остаётся нажать «отправить». Бот получает
// это как обычное сообщение и распознаёт токен по формату/подписи.
//
// Токен стейтлес (HMAC на AUTH_SECRET), как и для Telegram (см.
// telegramLink.ts), но подписан с меткой "vk" — токен для одного канала
// нельзя подсунуть боту другого канала.

const TOKEN_TTL_MS = 15 * 60 * 1000;
const PURPOSE = "vk";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET не задан");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 16);
}

export function createVkLinkToken(userId: string): string {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${PURPOSE}.${userId}.${expiry}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyVkLinkToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [purpose, userId, expiryStr, sig] = decoded.split(".");
    if (purpose !== PURPOSE || !userId || !expiryStr || !sig) return null;
    if (Date.now() > Number(expiryStr)) return null;
    if (sig !== sign(`${purpose}.${userId}.${expiryStr}`)) return null;
    return userId;
  } catch {
    return null;
  }
}
