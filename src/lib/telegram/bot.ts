import { Bot, InputFile, Keyboard } from "grammy";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import { getMirrorData } from "@/lib/mirror";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { verifyTelegramLinkToken } from "@/lib/telegramLink";
import path from "path";

// Telegram-бот — архитектурное ТЗ, раздел 10. Вся бизнес-логика (карточный
// движок, доступ по тарифу, зеркало) переиспользуется из core-слоя один в
// один с вебом — бот здесь только фасад, ничего не дублирует.

const MENU = new Keyboard()
  .text("🃏 Карта дня")
  .text("🪞 Зеркало")
  .row()
  .text("💳 Тариф")
  .resized();

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
    const draw = await getOrCreateDailyDraw({
      userId: user.id,
      channel: "TELEGRAM",
      wantsSecondary: canUserAccess(tariff, "SECOND_CARD"),
    });

    const primary = draw.primaryArchetype;
    if (primary.imageUrl) {
      const filePath = path.join(process.cwd(), "public", primary.imageUrl);
      await ctx.replyWithPhoto(new InputFile(filePath), {
        caption: shortCaption(primary),
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply(shortCaption(primary), { parse_mode: "Markdown" });
    }

    if (draw.secondaryArchetype) {
      const secondary = draw.secondaryArchetype;
      if (secondary.imageUrl) {
        const filePath = path.join(process.cwd(), "public", secondary.imageUrl);
        await ctx.replyWithPhoto(new InputFile(filePath), {
          caption: shortCaption(secondary),
          parse_mode: "Markdown",
        });
      }
    }
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
