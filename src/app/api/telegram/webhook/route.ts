import { webhookCallback } from "grammy";
import { createBot } from "@/lib/telegram/bot";

// Блокер: TELEGRAM_BOT_TOKEN ещё не задан (бот не создан в @BotFather —
// см. .env.example). Как только появится: создать бота, положить токен
// в .env, и на проде выставить вебхук на {APP_URL}/api/telegram/webhook
// через Telegram Bot API (setWebhook).

function getHandler() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const bot = createBot(token);
  return webhookCallback(bot, "std/http");
}

export async function POST(request: Request) {
  const handler = getHandler();
  if (!handler) {
    return new Response("Telegram bot not configured (TELEGRAM_BOT_TOKEN missing)", { status: 503 });
  }
  return handler(request);
}
