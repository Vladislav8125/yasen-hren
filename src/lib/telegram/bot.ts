import { Bot, Context, InputFile, Keyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import { addSecondaryCard, getOrCreateDailyDraw } from "@/lib/cardEngine";
import type { Archetype, LifeSphere } from "@/generated/prisma/client";
import { getMirrorData } from "@/lib/mirror";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { verifyTelegramLinkToken } from "@/lib/telegramLink";
import path from "path";

// Telegram-бот — архитектурное ТЗ, раздел 10. Вся бизнес-логика (карточный
// движок, доступ по тарифу, зеркало) переиспользуется из core-слоя один в
// один с вебом — бот здесь только фасад, ничего не дублирует.

const MENU = new Keyboard()
  .text("🃏 Карта дня")
  .row()
  .text("📖 Подробнее")
  .text("➕ Вторая карта")
  .row()
  .text("🪞 Зеркало")
  .text("💳 Тариф")
  .resized();

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

async function findLinkedUser(chatId: string) {
  return prisma.user.findUnique({ where: { telegramChatId: chatId } });
}

function shortCaption(archetype: { name: string; tagline: string; property: string | null; essence: string; clinicalFlag: string | null }) {
  const lines = [`*${archetype.name}*`, `«${archetype.tagline}»`, ""];
  if (archetype.property) lines.push(`Свойство: ${archetype.property}`);
  lines.push(`Суть: ${archetype.essence}`);
  if (archetype.clinicalFlag) lines.push("", `⚠ ${archetype.clinicalFlag}`);
  return lines.join("\n");
}

async function sendCard(ctx: Context, archetype: Archetype, label?: string) {
  const caption = `${label ? `*${label}*\n\n` : ""}${shortCaption(archetype)}`;
  if (archetype.imageUrl) {
    const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
    await ctx.replyWithPhoto(new InputFile(filePath), { caption, parse_mode: "Markdown" });
  } else {
    await ctx.reply(caption, { parse_mode: "Markdown" });
  }
}

function extendedText(archetype: Archetype) {
  const parts = [`${archetype.name} — полный разбор`];
  if (archetype.extendedDescription) parts.push(archetype.extendedDescription);
  if (archetype.function) parts.push(`Функция:\n${archetype.function}`);
  if (archetype.inLife) parts.push(`В жизни:\n${archetype.inLife}`);
  if (archetype.usageInstruction) parts.push(`Как пользоваться:\n${archetype.usageInstruction}`);
  if (archetype.ritual) parts.push(`Ритуал:\n${archetype.ritual}`);
  if (archetype.shadowSide) parts.push(`Тень:\n${archetype.shadowSide}`);
  if (archetype.cardQuestion) parts.push(`Вопрос карты:\n${archetype.cardQuestion}`);
  if (archetype.clinicalFlag) parts.push(`⚠ ${archetype.clinicalFlag}`);
  return parts.join("\n\n");
}

async function todayDraw(userId: string) {
  return getOrCreateDailyDraw({ userId, channel: "TELEGRAM", wantsSecondary: false });
}

export function createBot(token: string) {
  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const payload = ctx.match?.toString().trim();
    const chatId = ctx.chat.id.toString();

    if (payload) {
      const userId = verifyTelegramLinkToken(payload);
      if (!userId) {
        await ctx.reply("Ссылка для привязки устарела или неверна. Получите новую в личном кабинете на сайте.");
        return;
      }
      await prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
      await ctx.reply("Готово, аккаунт привязан! Жми «Карта дня», когда будешь готов.", { reply_markup: MENU });
      return;
    }

    const existing = await findLinkedUser(chatId);
    if (existing) {
      await ctx.reply(`С возвращением, ${existing.name}!`, { reply_markup: MENU });
    } else {
      await ctx.reply(
        "Привет! Я — Ясен Хрен. Чтобы получать карту дня здесь, привяжи аккаунт: зайди в личный кабинет на сайте и нажми «Привязать Telegram».",
      );
    }
  });

  bot.hears("🃏 Карта дня", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте.");
      return;
    }

    const tariff = effectiveTariff(user);
    const draw = await todayDraw(user.id);

    await sendCard(ctx, draw.primaryArchetype);

    if (draw.secondaryArchetype) {
      await sendCard(ctx, draw.secondaryArchetype, "Вторая карта");
    }

    if (draw.pathArchetype) {
      await sendCard(ctx, draw.pathArchetype, "Карта Пути · раз в неделю");
    }
    await ctx.reply("Выбери действие:", { reply_markup: MENU });
  });

  bot.hears("📖 Подробнее", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте."));
    const tariff = effectiveTariff(user);
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) {
      await ctx.reply(`Развёрнутое описание доступно со Standard. Оформить: ${appUrl()}/tariffs`, { reply_markup: MENU });
      return;
    }
    const draw = await todayDraw(user.id);
    await ctx.reply(extendedText(draw.primaryArchetype), { reply_markup: MENU });
  });

  bot.hears("➕ Вторая карта", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте."));
    const tariff = effectiveTariff(user);
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await ctx.reply(`Вторая карта доступна на Premium. Оформить: ${appUrl()}/tariffs`, { reply_markup: MENU });
      return;
    }
    const draw = await todayDraw(user.id);
    if (draw.secondaryArchetype) {
      await ctx.reply("Вторая карта уже выбрана на сегодня.", { reply_markup: MENU });
      return;
    }
    await ctx.reply("Выбери сферу жизни для второй карты:", { reply_markup: SPHERE_MENU });
  });

  bot.hears(Object.keys(SPHERE_CHOICES), async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) return void (await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте."));
    const tariff = effectiveTariff(user);
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await ctx.reply(`Вторая карта доступна на Premium. Оформить: ${appUrl()}/tariffs`, { reply_markup: MENU });
      return;
    }
    const choice = ctx.match?.toString();
    if (!choice) return;
    const sphere = SPHERE_CHOICES[choice];
    const draw = await addSecondaryCard({
      userId: user.id,
      secondaryMode: sphere ? "sphere" : "random",
      sphere,
    });
    if (draw.secondaryArchetype) await sendCard(ctx, draw.secondaryArchetype, "Вторая карта");
    await ctx.reply("Выбери действие:", { reply_markup: MENU });
  });

  bot.hears("◀️ Назад", async (ctx) => {
    await ctx.reply("Выбери действие:", { reply_markup: MENU });
  });

  bot.hears("🪞 Зеркало", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте.");
      return;
    }
    const tariff = effectiveTariff(user);
    if (!canUserAccess(tariff, "MIRROR")) {
      await ctx.reply(`Зеркало доступно со Standard. Оформить: ${appUrl()}/tariffs`);
      return;
    }

    const data = await getMirrorData(user.id);
    if (data.totalDraws === 0) {
      await ctx.reply("Пока нет истории — загляни через несколько дней.");
      return;
    }
    const lines = [`За последние ${data.windowDays} дней:`, ""];
    for (const a of data.topArchetypes) {
      lines.push(`• ${a.name} — ${a.count} раз(а)`);
    }
    await ctx.reply(lines.join("\n"));
  });

  bot.hears("💳 Тариф", async (ctx) => {
    const user = await findLinkedUser(ctx.chat.id.toString());
    if (!user) {
      await ctx.reply("Аккаунт ещё не привязан — сделай это в личном кабинете на сайте.");
      return;
    }
    const tariff = effectiveTariff(user);
    await ctx.reply(`Твой тариф: ${tariff}\nУправление: ${appUrl()}/tariffs`);
  });

  return bot;
}
