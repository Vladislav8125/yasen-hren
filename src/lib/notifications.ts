import { prisma } from "@/lib/prisma";
import { telegramBotConfig } from "@/lib/telegram/client";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import { shortCardDescription } from "@/lib/bot/cardPresentation";
import { effectiveTariff } from "@/lib/access";
import type { Archetype } from "@/generated/prisma/client";
import path from "path";

// Единая точка отправки уведомлений — Telegram, VK и MAX.
// Используется как кроном (ежедневное напоминание), так и ручной рассылкой из админки.
//
// Текст ежедневного напоминания генерируется через OpenRouter (LLM) —
// каждый день разный, в стиле Алекса Хормози + язык карт.

type TelegramApi = {
  sendMessage: (chatId: string, text: string, extra?: Record<string, unknown>) => Promise<unknown>;
  sendPhoto: (chatId: string, photo: unknown, extra?: Record<string, unknown>) => Promise<unknown>;
};

function getTgBot(): { api: TelegramApi; InputFile: new (path: string) => unknown } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Bot, InputFile } = require("grammy");
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    return { api: new Bot(token, telegramBotConfig()).api as TelegramApi, InputFile };
  } catch {
    return null;
  }
}

const TELEGRAM_MENU = {
  keyboard: [
    [{ text: "🃏 Получить карту дня" }],
    [{ text: "📖 Подробнее" }, { text: "➕ Вторая карта" }],
    [{ text: "🪞 Мой путь" }, { text: "💳 Тариф" }],
    [{ text: "🛒 Купить колоду" }],
    [{ text: "🎁 Премиум на 10 дней" }],
    [{ text: "📅 Консультация с основателем" }],
  ],
  resize_keyboard: true,
};

const VK_MENU = JSON.stringify({
  one_time: false,
  buttons: [
    [{ action: { type: "text", label: "🃏 Получить карту дня" }, color: "primary" }],
    [{ action: { type: "text", label: "📖 Подробнее" }, color: "secondary" }, { action: { type: "text", label: "➕ Вторая карта" }, color: "secondary" }],
    [{ action: { type: "text", label: "🪞 Мой путь" }, color: "secondary" }],
    [{ action: { type: "text", label: "💳 Тариф" }, color: "secondary" }],
    [{ action: { type: "text", label: "🛒 Купить колоду" }, color: "secondary" }],
    [{ action: { type: "text", label: "🎁 Премиум на 10 дней" }, color: "secondary" }],
    [{ action: { type: "text", label: "📅 Консультация с основателем" }, color: "secondary" }],
  ],
});

async function sendTelegramCard(chatId: string, archetype: Archetype): Promise<boolean> {
  try {
    const bot = getTgBot();
    if (!bot) return false;
    const caption = `${archetype.name}\n«${archetype.tagline}»`;
    if (archetype.imageUrl) {
      const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
      await bot.api.sendPhoto(chatId, new bot.InputFile(filePath), { caption });
    } else {
      await bot.api.sendMessage(chatId, caption);
    }
    await bot.api.sendMessage(chatId, shortCardDescription(archetype), { reply_markup: TELEGRAM_MENU });
    return true;
  } catch (error) {
    console.error("Telegram daily card delivery failed", error);
    return false;
  }
}

async function sendVkCard(userId: string, archetype: Archetype): Promise<boolean> {
  try {
    const { vkSendMessage, vkUploadPhoto } = await import("@/lib/vk/api");
    const caption = `${archetype.name}\n«${archetype.tagline}»`;
    if (archetype.imageUrl) {
      const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
      const attachment = await vkUploadPhoto(userId, filePath);
      await vkSendMessage(userId, caption, { attachment });
    } else {
      await vkSendMessage(userId, caption);
    }
    await vkSendMessage(userId, shortCardDescription(archetype), { keyboard: VK_MENU });
    return true;
  } catch (error) {
    console.error("VK daily card delivery failed", error);
    return false;
  }
}

async function sendMaxCard(userId: string, archetype: Archetype): Promise<boolean> {
  try {
    const { maxSendMessage } = await import("@/lib/max/api");
    const caption = `${archetype.name}\n«${archetype.tagline}»`;
    const buttons = archetype.imageUrl
      ? [[{ type: "link" as const, text: "Открыть изображение карты", url: `${(process.env.APP_URL ?? "https://yasenhren.ru").replace(/\/+$/, "")}${archetype.imageUrl}` }]]
      : undefined;
    await maxSendMessage(userId, caption, { buttons });
    await maxSendMessage(userId, shortCardDescription(archetype));
    return true;
  } catch (error) {
    console.error("MAX daily card delivery failed", error);
    return false;
  }
}

type DeliveryResult = { ok: boolean; blocked: boolean };

export async function notifyShopOrderPaid(order: { sourceChannel: string | null; sourceExternalId: string | null; variant: string | null }) {
  if (!order.sourceChannel || !order.sourceExternalId) return;
  const variant = order.variant === "SOFT_TOUCH" ? "софт-тач" : "глянец";
  const text = `✅ Оплата получена. Заказ на колоду «Ясен Хрен» (${variant}) оформлен. Мы свяжемся с вами по данным из заказа.`;
  try {
    if (order.sourceChannel === "TELEGRAM") {
      const bot = getTgBot();
      if (bot) await bot.api.sendMessage(order.sourceExternalId, text);
    } else if (order.sourceChannel === "VK") {
      const { vkSendMessage } = await import("@/lib/vk/api");
      await vkSendMessage(order.sourceExternalId, text);
    } else if (order.sourceChannel === "MAX") {
      const { maxSendMessage } = await import("@/lib/max/api");
      await maxSendMessage(order.sourceExternalId, text);
    }
  } catch (error) {
    console.error("Shop payment confirmation could not be delivered", error);
  }
}

function isBlockedError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  return /403|blocked|forbidden|deactivated|blacklist|permission denied|user not found/i.test(text);
}

async function deliverTelegram(chatId: string, text: string, extra?: Record<string, unknown>): Promise<DeliveryResult> {
  try {
    const bot = getTgBot();
    if (!bot) return { ok: false, blocked: false };
    await bot.api.sendMessage(chatId, text, { parse_mode: "HTML", ...extra });
    return { ok: true, blocked: false };
  } catch (error) {
    return { ok: false, blocked: isBlockedError(error) };
  }
}

async function sendTelegram(chatId: string, text: string, extra?: Record<string, unknown>): Promise<boolean> {
  return (await deliverTelegram(chatId, text, extra)).ok;
}

async function deliverVk(userId: string, text: string): Promise<DeliveryResult> {
  if (!process.env.VK_GROUP_TOKEN) return { ok: false, blocked: false };
  try {
    const { vkSendMessage } = await import("@/lib/vk/api");
    await vkSendMessage(userId, text);
    return { ok: true, blocked: false };
  } catch (error) {
    return { ok: false, blocked: isBlockedError(error) };
  }
}

async function sendVk(userId: string, text: string): Promise<boolean> {
  return (await deliverVk(userId, text)).ok;
}

async function deliverMax(userId: string, text: string): Promise<DeliveryResult> {
  if (!process.env.MAX_BOT_TOKEN) return { ok: false, blocked: false };
  try {
    const { maxSendMessage } = await import("@/lib/max/api");
    await maxSendMessage(userId, text);
    return { ok: true, blocked: false };
  } catch (error) {
    return { ok: false, blocked: isBlockedError(error) };
  }
}

async function sendMax(userId: string, text: string): Promise<boolean> {
  return (await deliverMax(userId, text)).ok;
}

export type BroadcastSegment = "ALL" | "FREE" | "STANDARD" | "PREMIUM";
export type BroadcastChannel = "ALL" | "TELEGRAM" | "VK" | "MAX";

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  attempted?: number;
  blocked?: number;
}

/** Выдать карту дня во всех подключённых каналах в 08:00 по Москве. */
export async function sendDailyCards(): Promise<BroadcastResult> {
  const users = await prisma.user.findMany({
    where: { OR: [{ telegramChatId: { not: null } }, { vkUserId: { not: null } }, { maxUserId: { not: null } }] },
    select: { id: true, telegramChatId: true, vkUserId: true, maxUserId: true },
  });

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      const draw = await getOrCreateDailyDraw({
        userId: user.id,
        channel: user.telegramChatId ? "TELEGRAM" : user.vkUserId ? "VK" : "MAX",
        wantsSecondary: false,
      });
      const telegramOk = user.telegramChatId ? await sendTelegramCard(user.telegramChatId, draw.primaryArchetype) : false;
      const vkOk = user.vkUserId ? await sendVkCard(user.vkUserId, draw.primaryArchetype) : false;
      const maxOk = user.maxUserId ? await sendMaxCard(user.maxUserId, draw.primaryArchetype) : false;
      if (telegramOk || vkOk || maxOk) sent++;
      else failed++;
    } catch (error) {
      console.error(`Daily card preparation failed for user ${user.id}`, error);
      failed++;
    }
  }

  return { total: users.length, sent, failed };
}

type BroadcastUser = {
  id: string;
  name: string;
  tariff: "FREE" | "STANDARD" | "PREMIUM";
  tariffExpiresAt: Date | null;
  premiumTrialExpiresAt: Date | null;
  telegramChatId: string | null;
  vkUserId: string | null;
  maxUserId: string | null;
};

function channelWhere(channel: BroadcastChannel) {
  if (channel === "TELEGRAM") return { telegramChatId: { not: null } };
  if (channel === "VK") return { vkUserId: { not: null } };
  if (channel === "MAX") return { maxUserId: { not: null } };
  return { OR: [{ telegramChatId: { not: null } }, { vkUserId: { not: null } }, { maxUserId: { not: null } }] };
}

async function getBroadcastUsers(segment: BroadcastSegment, channel: BroadcastChannel): Promise<BroadcastUser[]> {
  const users = await prisma.user.findMany({
    where: channelWhere(channel),
    select: { id: true, name: true, tariff: true, tariffExpiresAt: true, premiumTrialExpiresAt: true, telegramChatId: true, vkUserId: true, maxUserId: true },
  });
  return users.filter((user) => segment === "ALL" || effectiveTariff(user) === segment);
}

export async function getBroadcastUserById(userId: string): Promise<BroadcastUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, tariff: true, tariffExpiresAt: true, premiumTrialExpiresAt: true, telegramChatId: true, vkUserId: true, maxUserId: true },
  });
}

export async function countBroadcastRecipients(segment: BroadcastSegment, channel: BroadcastChannel) {
  return (await getBroadcastUsers(segment, channel)).length;
}

const BROADCAST_DELAY_MS = 150;
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function deliverToUser(user: BroadcastUser, message: string, channel: BroadcastChannel) {
  const attempts: Array<() => Promise<DeliveryResult>> = [];
  if ((channel === "ALL" || channel === "TELEGRAM") && user.telegramChatId) attempts.push(() => deliverTelegram(user.telegramChatId!, message));
  if ((channel === "ALL" || channel === "VK") && user.vkUserId) attempts.push(() => deliverVk(user.vkUserId!, message));
  if ((channel === "ALL" || channel === "MAX") && user.maxUserId) attempts.push(() => deliverMax(user.maxUserId!, message));

  let sent = 0;
  let failed = 0;
  let blocked = 0;
  for (const attempt of attempts) {
    const result = await attempt();
    if (result.ok) sent++;
    else {
      failed++;
      if (result.blocked) blocked++;
    }
    await sleep(BROADCAST_DELAY_MS);
  }
  return { attempted: attempts.length, sent, failed, blocked };
}

/** Отправить сообщение выбранному сегменту и каналам с паузой между отправками. */
export async function broadcastToSegment(message: string, segment: BroadcastSegment, channel: BroadcastChannel): Promise<BroadcastResult> {
  const users = await getBroadcastUsers(segment, channel);

  let sent = 0;
  let failed = 0;
  let attempted = 0;
  let blocked = 0;

  for (const user of users) {
    const result = await deliverToUser(user, message, channel);
    attempted += result.attempted;
    blocked += result.blocked;
    if (result.sent > 0) sent++;
    else failed++;
  }

  return { total: users.length, sent, failed, attempted, blocked };
}

/** Совместимость для внутренних вызовов: ручная рассылка всем сегментам и каналам. */
export async function broadcastToAll(message: string): Promise<BroadcastResult> {
  return broadcastToSegment(message, "ALL", "ALL");
}

export async function sendBroadcastTest(user: BroadcastUser, message: string, channel: BroadcastChannel): Promise<BroadcastResult> {
  const result = await deliverToUser(user, message, channel);
  return { total: 1, sent: result.sent > 0 ? 1 : 0, failed: result.sent > 0 ? 0 : 1, attempted: result.attempted, blocked: result.blocked };
}

/** Найти пользователей, которые сегодня ещё не открыли карту, и отправить им напоминание. */
export async function sendDailyReminder(): Promise<BroadcastResult> {
  const today = new Date();
  const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { telegramChatId: { not: null } },
        { vkUserId: { not: null } },
        { maxUserId: { not: null } },
      ],
      draws: { none: { date: dateOnly } },
    },
    select: { id: true, telegramChatId: true, vkUserId: true, maxUserId: true, name: true },
  });

  if (users.length === 0) return { total: 0, sent: 0, failed: 0 };

  const text = await generateReminderText();

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const personalized = text.replace("{name}", user.name || "друг");
    let ok = false;
    if (user.telegramChatId) {
      ok = await sendTelegram(user.telegramChatId, personalized);
    }
    if (!ok && user.vkUserId) {
      ok = await sendVk(user.vkUserId, personalized);
    }
    if (!ok && user.maxUserId) {
      ok = await sendMax(user.maxUserId, personalized);
    }
    if (ok) sent++;
    else failed++;
  }

  return { total: users.length, sent, failed };
}

/** За 3 дня до автосписания — напоминание с понятным способом отключить продление. */
export async function sendAutoRenewalReminder(): Promise<BroadcastResult> {
  const inThreeDays = new Date();
  inThreeDays.setUTCDate(inThreeDays.getUTCDate() + 3);
  const start = new Date(Date.UTC(inThreeDays.getUTCFullYear(), inThreeDays.getUTCMonth(), inThreeDays.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      nextChargeAt: { gte: start, lt: end },
      OR: [{ reminderSentFor: null }, { reminderSentFor: { lt: start } }],
    },
    include: {
      user: { select: { id: true, telegramChatId: true, vkUserId: true, maxUserId: true, name: true } },
    },
  });

  if (subscriptions.length === 0) return { total: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const appUrl = process.env.APP_URL ?? "https://yasenhren.ru";

  for (const subscription of subscriptions) {
    const user = subscription.user;
    const tariffName = subscription.tariff === "PREMIUM" ? "Премиум" : "Стандарт";
    const chargeDate = subscription.nextChargeAt.toLocaleDateString("ru-RU");
    const text = [
      `<b>${user.name}, ${chargeDate} будет продлён тариф ${tariffName}.</b>`,
      "",
      "Если продолжаешь путь — ничего делать не нужно. Если хочешь отключить автопродление, сделай это в профиле: доступ сохранится до конца уже оплаченного периода.",
      "",
      `<a href="${appUrl}/profile#subscription">Управление подпиской</a>`,
    ].join("\n");

    let ok = false;
    if (user.telegramChatId) {
      ok = await sendTelegram(user.telegramChatId, text, {
        reply_markup: {
          inline_keyboard: [[
            { text: "Продолжить", url: `${appUrl}/profile` },
            { text: "Отключить", url: `${appUrl}/profile#subscription` },
          ]],
        },
      });
    }
    if (!ok && user.vkUserId) {
      ok = await sendVk(user.vkUserId, text);
    }
    if (!ok && user.maxUserId) {
      ok = await sendMax(user.maxUserId, text);
    }
    if (ok) sent++;
    else failed++;

    if (ok) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { reminderSentFor: start },
      });
    }
  }

  return { total: subscriptions.length, sent, failed };
}

// ── Генерация текста через OpenRouter ──

const SYSTEM_PROMPT = `Ты — редактор пуш-уведомлений для приложения «Ясен Хрен» — игра с архетипическими картами для ежедневной психологической гигиены.

Твоя задача — написать короткое напоминание (3-5 предложений) для пользователя, который ещё не открыл свою карту дня.

ПРАВИЛА:
1. Стиль: Алекс Хормози — короткие рубленые фразы, без воды, прямой призыв, уверенный тон. Никаких «возможно», «попробуйте», «может быть».
2. Язык карт: архетипический, метафоричный, чуть мистический. Карта — зеркало, а не предсказание. Она показывает правду, которую человек сам от себя прячет.
3. Каждый день — НОВЫЙ текст. Не повторяй предыдущие. Меняй метафоры, заходы, интонацию.
4. Обращение — на «ты», к одному человеку.
5. Имя пользователя вставляется как {name}.
6. В конце всегда добавляй ровно две строки: «Открыть карту дня» и на следующей строке «↓». Не добавляй URL, HTML-ссылки и другие кликабельные элементы.
7. Без приветствий и прощаний. Сразу к делу.
8. Только HTML-форматирование: <b>жирный</b> для ключевых фраз. Без Markdown.

ФОРМАТ ВЫВОДА — ТОЛЬКО текст, без пояснений и кавычек.`;

const STATIC_FALLBACK = `<b>Карта дня уже на столе.</b>

Каждое утро ты выбираешь: посмотреть правде в глаза или прожить день на автопилоте. Карта не обещает, что будет легко. Она обещает, что будет честно.

Сегодняшний архетип не предскажет будущее. Он покажет тебе — где ты прячешься от себя самого.

Ты уже здесь. Остался один клик.

Открыть карту дня
↓`;

const REMINDER_CTA = "Открыть карту дня\n↓";

/**
 * Telegram превращает URL в активную ссылку, а VK может распознавать её даже
 * в обычном тексте. Убираем URL и HTML-якоря независимо от того, соблюла ли
 * модель инструкцию, затем всегда ставим единый текстовый указатель.
 */
export function formatDailyReminder(text: string): string {
  const withoutAnchors = text.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  const withoutUrls = withoutAnchors.replace(/(?:https?:\/\/|www\.)\S+|yasen-hren\.ru\/today\S*/gi, "");
  const body = withoutUrls
    .split("\n")
    .filter((line) => !/открыть\s+карту\s+дня/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return body ? `${body}\n\n${REMINDER_CTA}` : REMINDER_CTA;
}

async function generateReminderText(): Promise<string> {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return STATIC_FALLBACK;

    const model = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5";
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Yasen Khren",
      },
      body: JSON.stringify({
        model,
        max_tokens: 250,
        temperature: 0.9,
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `День ${dayOfYear}. Напиши напоминание открыть карту дня. Не повторяй предыдущие.`,
          },
        ],
      }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return STATIC_FALLBACK;

    return formatDailyReminder(content);
  } catch {
    return STATIC_FALLBACK;
  }
}
