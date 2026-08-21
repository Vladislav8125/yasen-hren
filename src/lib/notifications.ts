import { prisma } from "@/lib/prisma";

// Единая точка отправки уведомлений — Telegram и VK.
// Используется как кроном (ежедневное напоминание), так и ручной рассылкой из админки.
//
// Текст ежедневного напоминания генерируется через OpenRouter (LLM) —
// каждый день разный, в стиле Алекса Хормози + язык карт.

function getTgBot(): { api: { sendMessage: (chatId: string, text: string, extra?: Record<string, unknown>) => Promise<unknown> } } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Bot } = require("grammy");
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    return new Bot(token) as never;
  } catch {
    return null;
  }
}

async function sendTelegram(chatId: string, text: string, extra?: Record<string, unknown>): Promise<boolean> {
  try {
    const bot = getTgBot();
    if (!bot) return false;
    await bot.api.sendMessage(chatId, text, { parse_mode: "HTML", ...extra });
    return true;
  } catch {
    return false;
  }
}

async function sendVk(userId: string, text: string): Promise<boolean> {
  if (!process.env.VK_GROUP_TOKEN) return false;
  try {
    const { vkSendMessage } = await import("@/lib/vk/api");
    await vkSendMessage(userId, text);
    return true;
  } catch {
    return false;
  }
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

/** Отправить сообщение всем пользователям с привязанным Telegram/VK. */
export async function broadcastToAll(message: string): Promise<BroadcastResult> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { telegramChatId: { not: null } },
        { vkUserId: { not: null } },
      ],
    },
    select: { id: true, telegramChatId: true, vkUserId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    let ok = false;
    if (user.telegramChatId) {
      ok = await sendTelegram(user.telegramChatId, message);
    }
    if (!ok && user.vkUserId) {
      ok = await sendVk(user.vkUserId, message);
    }
    if (ok) sent++;
    else failed++;
  }

  return { total: users.length, sent, failed };
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
      ],
      draws: { none: { date: dateOnly } },
    },
    select: { id: true, telegramChatId: true, vkUserId: true, name: true },
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
      user: { select: { id: true, telegramChatId: true, vkUserId: true, name: true } },
    },
  });

  if (subscriptions.length === 0) return { total: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const appUrl = process.env.APP_URL ?? "https://yasenhren.ru";

  for (const subscription of subscriptions) {
    const user = subscription.user;
    const tariffName = subscription.tariff === "PREMIUM" ? "Premium" : "Standard";
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
6. В конце всегда ссылка на открытие карты.
7. Без приветствий и прощаний. Сразу к делу.
8. Только HTML-форматирование: <b>жирный</b> для ключевых фраз. Без Markdown.

ФОРМАТ ВЫВОДА — ТОЛЬКО текст, без пояснений и кавычек.`;

const STATIC_FALLBACK = `<b>Карта дня уже на столе.</b>

Каждое утро ты выбираешь: посмотреть правде в глаза или прожить день на автопилоте. Карта не обещает, что будет легко. Она обещает, что будет честно.

Сегодняшний архетип не предскажет будущее. Он покажет тебе — где ты прячешься от себя самого.

Ты уже здесь. Остался один клик.

<a href="https://yasen-hren.ru/today">Открыть карту дня</a>`;

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

    return content;
  } catch {
    return STATIC_FALLBACK;
  }
}
