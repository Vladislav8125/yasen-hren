import { Bot, Context, InlineKeyboard, InputFile, Keyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import { addSecondaryCard, getOrCreateDailyDraw } from "@/lib/cardEngine";
import type { Archetype, LifeSphere, Tariff } from "@/generated/prisma/client";
import { getMirrorData, sphereLabel } from "@/lib/mirror";
import { canUserAccess, effectiveTariffForChannel } from "@/lib/access";
import { createTelegramLinkToken, verifyTelegramLinkToken } from "@/lib/telegramLink";
import { deckSelectionUrl } from "@/lib/direct-shop-token";
import { BOT_WELCOME, getOrCreateBotUser } from "@/lib/bot/guestUser";
import { telegramBotConfig } from "@/lib/telegram/client";
import { grantPremiumTrial } from "@/lib/premium-trial";
import {
  coreExtendedCardText,
  shortCardDescription,
  splitBotMessage,
} from "@/lib/bot/cardPresentation";
import path from "path";

// Telegram-бот — архитектурное ТЗ, раздел 10. Вся бизнес-логика (карточный
// движок, доступ по тарифу, зеркало) переиспользуется из core-слоя один в
// один с вебом — бот здесь только фасад, ничего не дублирует.

function menuKeyboard(chatId: string) {
  return new Keyboard()
    .text("🃏 Получить карту дня")
    .row()
    .text("📖 Подробнее")
    .text("➕ Вторая карта")
    .row()
    .text("🪞 Мой путь")
    .text("💳 Тариф")
    .row()
    .webApp("🛒 Купить колоду", deckSelectionUrl(appUrl(), "telegram", chatId))
    .row()
    .text("🎁 Премиум на 10 дней")
    .row()
    .text("📅 Консультация с основателем")
    .resized();
}

const SPHERE_MENU = new Keyboard()
  .text("💼 Дело")
  .text("❤️ Отношения")
  .row()
  .text("🫀 Тело")
  .text("☯️ Баланс")
  .row()
  .text("🎲 Случайная")
  .text("◀️ Назад")
  .resized();

const SPHERE_CHOICES: Record<string, LifeSphere | undefined> = {
  "💼 Дело": "BUSINESS",
  "❤️ Отношения": "RELATIONS",
  "🫀 Тело": "HEALTH",
  "☯️ Баланс": "HARMONY",
  "🎲 Случайная": undefined,
};

function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function deckKeyboard(chatId: string) {
  return new InlineKeyboard().url("Купить колоду", deckSelectionUrl(appUrl(), "telegram", chatId));
}

function tariffPaymentUrl(userId: string, tariff: Exclude<Tariff, "FREE">) {
  const token = createTelegramLinkToken(userId);
  const query = new URLSearchParams({ token, tariff });
  return `${appUrl().replace(/\/$/, "")}/api/telegram/payment?${query.toString()}`;
}

function tariffPaymentKeyboard(userId: string) {
  return new InlineKeyboard()
    .url("Стандарт · 590 ₽", tariffPaymentUrl(userId, "STANDARD"))
    .row()
    .url("Премиум · 3 500 ₽", tariffPaymentUrl(userId, "PREMIUM"));
}

function premiumPaymentKeyboard(userId: string) {
  return new InlineKeyboard().url("Оформить Премиум · 3 500 ₽", tariffPaymentUrl(userId, "PREMIUM"));
}

function founderConsultationKeyboard(userId: string) {
  return new InlineKeyboard()
    .url("Премиум · консультация включена", tariffPaymentUrl(userId, "PREMIUM"))
    .row()
    .url("Разовая консультация", `${appUrl()}/shop/checkout?product=FOUNDER`);
}

// Для активности используем календарные дни Москвы, а не дату карты,
// которая переключается в 08:00. Повторные сообщения за день не увеличивают серию.
function moscowCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
}

async function recordVisitAndMaybeOfferDeck(ctx: Context, next: () => Promise<void>) {
  if (ctx.chat?.type !== "private" || (!ctx.message && !ctx.callbackQuery)) {
    await next();
    return;
  }

  await next();

  // Учёт серии не должен останавливать карту или покупку при временной ошибке БД.
  try {
  const chatId = ctx.chat.id.toString();
  const date = moscowCalendarDate();
  await prisma.telegramBotVisit.upsert({
    where: { chatId_date: { chatId, date } }, create: { chatId, date }, update: {},
  });

  const firstDay = new Date(date);
  firstDay.setUTCDate(firstDay.getUTCDate() - 9);
  const visits = await prisma.telegramBotVisit.count({
    where: { chatId, date: { gte: firstDay, lte: date } },
  });
  if (visits !== 10) return;

  // Уникальный chatId защищает от нескольких одинаковых поздравлений, если
  // пользователь отправит несколько сообщений в день завершения серии.
  const claim = await prisma.telegramDeckOffer.createMany({
    data: [{ chatId }], skipDuplicates: true,
  });
  if (claim.count === 0) return;

  try {
    await ctx.reply(
      "🃏 10 дней подряд — вот это привычка!\n\nКстати, карты «Ясен Хрен» есть и в физической версии. Их можно держать в руках, доставать каждый день или подарить близкому.\n\nПосмотреть и заказать колоду:",
      { reply_markup: deckKeyboard(chatId) },
    );
  } catch (error) {
    await prisma.telegramDeckOffer.deleteMany({ where: { chatId, sentAt: null } });
    throw error;
  }
  await prisma.telegramDeckOffer.update({ where: { chatId }, data: { sentAt: new Date() } });
  } catch (error) {
    console.error("Telegram visit streak could not be processed", error);
  }
}

// Telegram ограничивает текст одного сообщения 4096 символами. Развёрнутые
// описания карт могут быть длиннее, поэтому режем их по абзацам и отправляем
// несколькими сообщениями. Последнее сообщение получает переданную клавиатуру.
const TELEGRAM_TEXT_LIMIT = 3900;

function splitTelegramText(text: string, limit = TELEGRAM_TEXT_LIMIT): string[] {
  return splitBotMessage(text, limit);
}

async function replyLong(ctx: Context, text: string, extra?: Record<string, unknown>) {
  const chunks = splitTelegramText(text);
  for (let index = 0; index < chunks.length; index += 1) {
    await ctx.reply(chunks[index], index === chunks.length - 1 ? extra : undefined);
  }
}

async function findLinkedUser(chatId: string) {
  return prisma.user.findUnique({ where: { telegramChatId: chatId } });
}

async function sendCard(ctx: Context, archetype: Archetype, label?: string) {
  const caption = [label, archetype.name, `«${archetype.tagline}»`].filter(Boolean).join("\n");
  if (archetype.imageUrl) {
    const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
    await ctx.replyWithPhoto(new InputFile(filePath), { caption });
  } else {
    await ctx.reply(caption);
  }
  await replyLong(ctx, shortCardDescription(archetype));
}

async function todayDraw(userId: string) {
  return getOrCreateDailyDraw({ userId, channel: "TELEGRAM", wantsSecondary: false });
}

export function createBot(token: string) {
  const bot = new Bot(token, telegramBotConfig());

  bot.use(recordVisitAndMaybeOfferDeck);

  bot.command("start", async (ctx) => {
    const payload = ctx.match?.toString().trim();
    const chatId = ctx.chat.id.toString();

    if (payload) {
      const userId = verifyTelegramLinkToken(payload);
      if (!userId) {
        await ctx.reply("⚠️ Ссылка для привязки устарела или неверна.\n\nОткрой личный кабинет на сайте и получи новую.");
        return;
      }
      const owner = await findLinkedUser(chatId);
      if (owner && owner.id !== userId) {
        // Ссылка подписана AUTH_SECRET и создаётся только из авторизованного
        // кабинета, поэтому повторная привязка по новой ссылке — явное действие
        // владельца аккаунта. Освобождаем прежнюю связь и переносим чат.
        await prisma.$transaction([
          prisma.user.update({ where: { id: owner.id }, data: { telegramChatId: null } }),
          prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } }),
        ]);
        await ctx.reply("✅ Telegram перепривязан к этому аккаунту.\n\nЖми «Карта дня», когда будешь готов.", { reply_markup: menuKeyboard(chatId) });
        return;
      }
      // Повторное открытие той же ссылки безопасно и не должно падать на
      // уникальном индексе telegramChatId.
      if (!owner) {
        await prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
      }
      await ctx.reply("✅ Аккаунт привязан.\n\nЖми «Карта дня», когда будешь готов.", { reply_markup: menuKeyboard(chatId) });
      return;
    }

    const { user, created } = await getOrCreateBotUser("TELEGRAM", chatId, ctx.from?.first_name);
    await ctx.reply(created ? BOT_WELCOME : `👋 С возвращением, ${user.name}!\n\nНажми «🃏 Получить карту дня» или выбери другое действие.`, { reply_markup: menuKeyboard(chatId) });
  });

  const activateTrial = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("🔗 Сначала привяжи аккаунт в личном кабинете на сайте.\n\nЗатем снова нажми эту кнопку.");
      return;
    }
    const result = await grantPremiumTrial(user.id, "TELEGRAM");
    if (result.granted) {
      await ctx.reply(`🎁 Премиум активен на 10 дней.\n\n📅 Действует до ${result.expiresAt.toLocaleDateString("ru-RU")}.`, { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
    } else if (result.reason === "premium-active") {
      await ctx.reply("✨ У тебя уже действует тариф «Премиум».\n\nПробный период не нужен.", { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
    } else {
      await ctx.reply("🎁 Пробный тариф «Премиум» уже был активирован для этого аккаунта. Выбери подходящий тариф:", { reply_markup: tariffPaymentKeyboard(user.id) });
    }
  };

  bot.command("trial", activateTrial);
  bot.hears("🎁 Премиум на 10 дней", activateTrial);

  bot.hears(["🃏 Получить карту дня", "🃏 Карта дня"], async (ctx) => {
    const { user } = await getOrCreateBotUser("TELEGRAM", ctx.chat.id.toString(), ctx.from?.first_name);

    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    const draw = await todayDraw(user.id);

    await sendCard(ctx, draw.primaryArchetype);

    if (draw.secondaryArchetype && canUserAccess(tariff, "SECOND_CARD")) {
      await sendCard(ctx, draw.secondaryArchetype, "Вторая карта");
    }

    if (draw.pathArchetype && tariff !== "FREE") {
      await sendCard(ctx, draw.pathArchetype, "Карта Пути · раз в неделю");
    }
    await ctx.reply("👇 Выбери действие:", { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
  });

  bot.hears("📖 Подробнее", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте."));
    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) {
      await ctx.reply("🔒 Развёрнутое описание доступно с платным тарифом. Выбери подходящий:", { reply_markup: tariffPaymentKeyboard(user.id) });
      return;
    }
    const draw = await todayDraw(user.id);
    await replyLong(ctx, coreExtendedCardText(draw.primaryArchetype), { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
  });

  bot.hears("➕ Вторая карта", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте."));
    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await ctx.reply("🔒 Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { reply_markup: premiumPaymentKeyboard(user.id) });
      return;
    }
    const draw = await todayDraw(user.id);
    if (draw.secondaryArchetype) {
      await ctx.reply("🃏 Вторая карта уже выбрана на сегодня.", { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
      return;
    }
    await ctx.reply("🎯 Выбери сферу жизни для второй карты:", { reply_markup: SPHERE_MENU });
  });

  bot.hears(Object.keys(SPHERE_CHOICES), async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте."));
    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await ctx.reply("🔒 Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { reply_markup: premiumPaymentKeyboard(user.id) });
      return;
    }
    const choice = ctx.match?.toString();
    if (!choice) return;
    const sphere = SPHERE_CHOICES[choice];
    await todayDraw(user.id);
    const draw = await addSecondaryCard({
      userId: user.id,
      secondaryMode: sphere ? "sphere" : "random",
      sphere,
    });
    if (draw.secondaryArchetype) {
      await sendCard(ctx, draw.secondaryArchetype, "Вторая карта");
    }
    await ctx.reply("👇 Выбери действие:", { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
  });

  bot.hears("◀️ Назад", async (ctx) => {
    await ctx.reply("👇 Выбери действие:", { reply_markup: menuKeyboard(ctx.chat.id.toString()) });
  });

  bot.hears("🪞 Мой путь", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте.");
      return;
    }
    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    if (!canUserAccess(tariff, "MIRROR")) {
      await ctx.reply("🔒 «Мой путь» доступен с платным тарифом. Выбери подходящий:", { reply_markup: tariffPaymentKeyboard(user.id) });
      return;
    }

    const data = await getMirrorData(user.id);
    if (data.totalDraws === 0) {
      await ctx.reply("🪞 Пока нет истории.\n\nЗагляни через несколько дней.");
      return;
    }
    const lines = [`🪞 МОЙ ПУТЬ\nЗа последние ${data.windowDays} дней:`, ""];
    for (const a of data.topArchetypes) {
      lines.push(`• ${a.name} — ${a.count} раз(а)`);
    }
    if (canUserAccess(tariff, "MIRROR_FULL") && data.sphereTrends.length > 0) {
      lines.push("", "📈 ТРЕНДЫ ПО СФЕРАМ:");
      for (const trend of data.sphereTrends) lines.push(`• ${sphereLabel(trend.sphere)} — ${trend.count}`);
    }
    await ctx.reply(lines.join("\n"));
  });

  bot.hears("💳 Тариф", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте.");
      return;
    }
    const tariff = await effectiveTariffForChannel(user, "TELEGRAM");
    await ctx.reply(
      `💳 ТВОЙ ТАРИФ\n${tariff}\n\nВыбери тариф — откроется защищённая страница Robokassa. После подтверждения оплаты доступ включится автоматически.`,
      { reply_markup: tariffPaymentKeyboard(user.id) },
    );
  });

  bot.hears(["🛒 Купить колоду", "🛒 Колода софт-тач"], async (ctx) => {
    await ctx.reply(
      "🛒 Выбери одну из двух колод: глянец — 9 000 ₽ или софт-тач — 10 500 ₽. Регистрация и привязка к веб-базе не нужны.",
      { reply_markup: deckKeyboard(ctx.chat.id.toString()) },
    );
  });

  bot.hears(/^📅 Консультация(?: с основателем)?$/, async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("🔗 Аккаунт ещё не привязан.\n\nСделай это в личном кабинете на сайте."));
    await ctx.reply("📅 Выберите формат:\n\nПремиум — консультация с основателем входит в подписку.\nРазовая консультация — отдельная встреча без подписки.", { reply_markup: founderConsultationKeyboard(user.id) });
  });

  return bot;
}

