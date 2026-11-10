import path from "path";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { addSecondaryCard, getOrCreateDailyDraw } from "@/lib/cardEngine";
import type { Archetype, LifeSphere } from "@/generated/prisma/client";
import { getMirrorData, sphereLabel } from "@/lib/mirror";
import { canUserAccess, effectiveTariffForChannel } from "@/lib/access";
import { BOT_WELCOME } from "@/lib/bot/guestUser";
import { deckSelectionUrl } from "@/lib/direct-shop-token";
import { createVkLinkToken, verifyVkLinkToken } from "@/lib/vkLink";
import { vkSendMessage, vkUploadPhoto } from "./api";
import { grantPremiumTrial } from "@/lib/premium-trial";
import {
  coreExtendedCardText,
  shortCardDescription,
  splitBotMessage,
} from "@/lib/bot/cardPresentation";

// VK-бот — фасад поверх того же core-слоя, что и Telegram (src/lib/telegram/bot.ts):
// карточный движок, доступ по тарифу, зеркало переиспользуются один в один,
// ничего не дублируется (архитектурное ТЗ, раздел 10).

function menuKeyboard(vkUserId: string) {
  return JSON.stringify({
    one_time: false,
    buttons: [
      [{ action: { type: "text", label: "🃏 Получить карту дня" }, color: "primary" }],
      [
        { action: { type: "text", label: "📖 Подробнее" }, color: "secondary" },
        { action: { type: "text", label: "➕ Вторая карта" }, color: "secondary" },
      ],
      [{ action: { type: "text", label: "🪞 Мой путь" }, color: "secondary" }],
      [{ action: { type: "text", label: "💳 Тариф" }, color: "secondary" }],
      [{ action: { type: "open_link", label: "🛒 Купить колоду", link: deckSelectionUrl(appUrl(), "vk", vkUserId) } }],
      [{ action: { type: "text", label: "🎁 Премиум на 10 дней" }, color: "secondary" }],
      [{ action: { type: "text", label: "📅 Консультация с основателем" }, color: "secondary" }],
    ],
  });
}

const SPHERE_KEYBOARD = JSON.stringify({
  one_time: true,
  buttons: [
    [
      { action: { type: "text", label: "💼 Дело" }, color: "primary" },
      { action: { type: "text", label: "❤️ Отношения" }, color: "primary" },
    ],
    [
      { action: { type: "text", label: "🫀 Тело" }, color: "primary" },
      { action: { type: "text", label: "☯️ Баланс" }, color: "primary" },
    ],
    [
      { action: { type: "text", label: "🎲 Случайная" }, color: "secondary" },
      { action: { type: "text", label: "◀️ Назад" }, color: "secondary" },
    ],
  ],
});

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

function deckKeyboard(vkUserId: string) {
  return JSON.stringify({
    inline: true,
    buttons: [[{ action: { type: "open_link", link: deckSelectionUrl(appUrl(), "vk", vkUserId), label: "Купить колоду" } }]],
  });
}

function tariffKeyboard(userId: string) {
  const token = createVkLinkToken(userId);
  return JSON.stringify({ inline: true, buttons: [[
    { action: { type: "open_link", link: `${appUrl()}/api/vk/payment?token=${encodeURIComponent(token)}&tariff=STANDARD`, label: "Стандарт · 590 ₽" } },
    { action: { type: "open_link", link: `${appUrl()}/api/vk/payment?token=${encodeURIComponent(token)}&tariff=PREMIUM`, label: "Премиум · 3 500 ₽" } },
  ]] });
}

function premiumKeyboard(userId: string) {
  const token = createVkLinkToken(userId);
  return JSON.stringify({ inline: true, buttons: [[
    { action: { type: "open_link", link: `${appUrl()}/api/vk/payment?token=${encodeURIComponent(token)}&tariff=PREMIUM`, label: "Оформить Премиум · 3 500 ₽" } },
  ]] });
}

function founderConsultationKeyboard(userId: string) {
  const token = createVkLinkToken(userId);
  return JSON.stringify({ inline: true, buttons: [[
    { action: { type: "open_link", link: `${appUrl()}/api/vk/payment?token=${encodeURIComponent(token)}&tariff=PREMIUM`, label: "Премиум · консультация включена" } },
    { action: { type: "open_link", link: `${appUrl()}/shop/checkout?product=FOUNDER`, label: "Разовая консультация" } },
  ]] });
}

// VK Callback API также ограничивает длину одного сообщения. Развёрнутая
// карта собирается из нескольких больших блоков, поэтому отправляем её
// отдельными сообщениями по абзацам и оставляем клавиатуру на последнем.
const VK_TEXT_LIMIT = 3800;

function splitVkText(text: string, limit = VK_TEXT_LIMIT): string[] {
  return splitBotMessage(text, limit);
}

async function sendLongVkMessage(vkUserId: string, text: string, options?: { keyboard?: string }) {
  const chunks = splitVkText(text);
  for (let index = 0; index < chunks.length; index += 1) {
    await vkSendMessage(vkUserId, chunks[index], index === chunks.length - 1 ? options : undefined);
  }
}

async function findLinkedUser(vkUserId: string) {
  return prisma.user.findUnique({ where: { vkUserId } });
}

const GUEST_EMAIL_DOMAIN = "guest.vk.yasenhren.local";

async function getOrCreateGuest(vkUserId: string) {
  const existing = await findLinkedUser(vkUserId);
  if (existing) return { user: existing, created: false };

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  try {
    const user = await prisma.user.create({
      data: {
        email: `vk-${vkUserId}@${GUEST_EMAIL_DOMAIN}`,
        name: "Гость VK",
        passwordHash,
        vkUserId,
        preferredChannel: "VK",
        isGuest: true,
      },
    });
    return { user, created: true };
  } catch {
    const user = await findLinkedUser(vkUserId);
    if (!user) throw new Error("Не удалось создать гостевой профиль VK");
    return { user, created: false };
  }
}

async function mergeGuestIntoAccount(guestId: string, accountId: string, vkUserId: string) {
  await prisma.$transaction(async (tx) => {
    const [guest, account, guestDraws] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: guestId } }),
      tx.user.findUniqueOrThrow({ where: { id: accountId } }),
      tx.dailyDraw.findMany({ where: { userId: guestId }, select: { date: true } }),
    ]);
    const dates = guestDraws.map((draw) => draw.date);
    if (dates.length) {
      const accountDraws = await tx.dailyDraw.findMany({ where: { userId: accountId, date: { in: dates } }, select: { date: true } });
      if (accountDraws.length) await tx.dailyDraw.deleteMany({ where: { userId: guestId, date: { in: accountDraws.map((draw) => draw.date) } } });
      await tx.dailyDraw.updateMany({ where: { userId: guestId }, data: { userId: accountId } });
    }

    const transferTrial = Boolean(guest.premiumTrialUsedAt && !account.premiumTrialUsedAt);
    await tx.user.delete({ where: { id: guestId } });
    await tx.user.update({
      where: { id: accountId },
      data: {
        vkUserId,
        ...(transferTrial ? {
          premiumTrialStartedAt: guest.premiumTrialStartedAt,
          premiumTrialExpiresAt: guest.premiumTrialExpiresAt,
          premiumTrialUsedAt: guest.premiumTrialUsedAt,
          premiumTrialSource: guest.premiumTrialSource,
        } : {}),
      },
    });
  });
}

async function todayDraw(userId: string) {
  return getOrCreateDailyDraw({ userId, channel: "VK", wantsSecondary: false });
}

async function sendDailyCards(vkUserId: string, user: Awaited<ReturnType<typeof findLinkedUser>>) {
  if (!user) return;
  const tariff = await effectiveTariffForChannel(user, "VK");
  const draw = await todayDraw(user.id);
  await sendArchetype(vkUserId, draw.primaryArchetype);
  if (draw.secondaryArchetype && canUserAccess(tariff, "SECOND_CARD")) {
    await sendArchetype(vkUserId, draw.secondaryArchetype, "Вторая карта");
  }
  if (draw.pathArchetype && tariff !== "FREE") {
    await sendArchetype(vkUserId, draw.pathArchetype, "Карта Пути · раз в неделю");
  }
}

async function sendArchetype(
  vkUserId: string,
  archetype: Archetype,
  label?: string,
) {
  const caption = [label, archetype.name, `«${archetype.tagline}»`].filter(Boolean).join("\n");
  if (archetype.imageUrl) {
    try {
      const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
      const attachment = await vkUploadPhoto(vkUserId, filePath);
      await vkSendMessage(vkUserId, caption, { attachment });
    } catch (error) {
      // Некоторые токены сообществ выданы без scope "photos". Карта всё
      // равно приходит пользователю, только изображение открывается ссылкой.
      console.error("VK photo upload failed; sending image link instead", error);
      await vkSendMessage(vkUserId, `${caption}\n\nИзображение карты: ${appUrl()}${archetype.imageUrl}`);
    }
  } else {
    await vkSendMessage(vkUserId, caption);
  }
  await sendLongVkMessage(vkUserId, shortCardDescription(archetype));
}

/** Обрабатывает одно входящее сообщение VK Callback API (`message_new`). */
export async function handleVkMessage(vkUserId: string, text: string, linkToken?: string) {
  const trimmed = text.trim();

  const linkedUserId = verifyVkLinkToken(linkToken?.trim() || trimmed);
  if (linkedUserId) {
    const owner = await findLinkedUser(vkUserId);
    if (owner && owner.id !== linkedUserId) {
      if (owner.isGuest) {
        await mergeGuestIntoAccount(owner.id, linkedUserId, vkUserId);
        await vkSendMessage(vkUserId, "✅ Аккаунт привязан. История карт из VK перенесена на сайт.", { keyboard: menuKeyboard(vkUserId) });
        return;
      }
      // Код подписан AUTH_SECRET и создаётся в авторизованном кабинете, поэтому
      // новая ссылка явно подтверждает перенос VK на текущий аккаунт.
      await prisma.$transaction([
        prisma.user.update({ where: { id: owner.id }, data: { vkUserId: null } }),
        prisma.user.update({ where: { id: linkedUserId }, data: { vkUserId } }),
      ]);
      await vkSendMessage(vkUserId, "Готово, VK перепривязан к этому аккаунту! Жми «Карта дня», когда будешь готов.", {
        keyboard: menuKeyboard(vkUserId),
      });
      return;
    }
    // Повторная отправка того же кода идемпотентна — не падаем на
    // уникальном индексе vkUserId.
    if (!owner) {
      await prisma.user.update({ where: { id: linkedUserId }, data: { vkUserId } });
    }
    await vkSendMessage(vkUserId, "Готово, аккаунт привязан! Жми «Карта дня», когда будешь готов.", {
      keyboard: menuKeyboard(vkUserId),
    });
    return;
  }

  const user = await findLinkedUser(vkUserId);
  if (!user) {
    await getOrCreateGuest(vkUserId);
    await vkSendMessage(vkUserId, BOT_WELCOME, { keyboard: menuKeyboard(vkUserId) });
    return;
  }

  const tariff = await effectiveTariffForChannel(user, "VK");

  if (trimmed.includes("Премиум на 10 дней") || trimmed.includes("Premium на 10 дней") || trimmed === "/trial") {
    const result = await grantPremiumTrial(user.id, "VK");
    if (result.granted) {
      await vkSendMessage(vkUserId, `Готово! Премиум активен 10 дней — до ${result.expiresAt.toLocaleDateString("ru-RU")}.`, { keyboard: menuKeyboard(vkUserId) });
    } else if (result.reason === "premium-active") {
      await vkSendMessage(vkUserId, "У тебя уже действует платный тариф «Премиум» — пробный период не нужен.", { keyboard: menuKeyboard(vkUserId) });
    } else {
      await vkSendMessage(vkUserId, "🎁 Пробный тариф «Премиум» уже был активирован для этого аккаунта. Выбери подходящий тариф:", { keyboard: tariffKeyboard(user.id) });
    }
    return;
  }

  if (trimmed.includes("Получить карту дня") || trimmed.includes("Карта дня")) {
    await sendDailyCards(vkUserId, user);
    await vkSendMessage(vkUserId, "👇 Выбери действие:", { keyboard: menuKeyboard(vkUserId) });
    return;
  }

  if (trimmed.includes("Подробнее")) {
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) {
      await vkSendMessage(vkUserId, "Развёрнутое описание доступно с платным тарифом. Выбери подходящий:", { keyboard: tariffKeyboard(user.id) });
      return;
    }
    const draw = await todayDraw(user.id);
    await sendLongVkMessage(vkUserId, coreExtendedCardText(draw.primaryArchetype), { keyboard: menuKeyboard(vkUserId) });
    return;
  }

  if (trimmed.includes("Вторая карта")) {
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await vkSendMessage(vkUserId, "Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { keyboard: premiumKeyboard(user.id) });
      return;
    }
    const draw = await todayDraw(user.id);
    if (draw.secondaryArchetype) {
      await vkSendMessage(vkUserId, "Вторая карта уже выбрана на сегодня.", { keyboard: menuKeyboard(vkUserId) });
      return;
    }
    await vkSendMessage(vkUserId, "Выбери сферу жизни для второй карты:", { keyboard: SPHERE_KEYBOARD });
    return;
  }

  if (Object.prototype.hasOwnProperty.call(SPHERE_CHOICES, trimmed)) {
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await vkSendMessage(vkUserId, "Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { keyboard: premiumKeyboard(user.id) });
      return;
    }
    const sphere = SPHERE_CHOICES[trimmed];
    await todayDraw(user.id);
    const draw = await addSecondaryCard({
      userId: user.id,
      secondaryMode: sphere ? "sphere" : "random",
      sphere,
    });
    if (draw.secondaryArchetype) {
      await sendArchetype(vkUserId, draw.secondaryArchetype, "Вторая карта");
    }
    await vkSendMessage(vkUserId, "Выбери действие:", { keyboard: menuKeyboard(vkUserId) });
    return;
  }

  if (trimmed.includes("Назад")) {
    await vkSendMessage(vkUserId, "Выбери действие:", { keyboard: menuKeyboard(vkUserId) });
    return;
  }

  if (trimmed.includes("Мой путь")) {
    if (!canUserAccess(tariff, "MIRROR")) {
      await vkSendMessage(vkUserId, "«Мой путь» доступен с платным тарифом. Выбери подходящий:", { keyboard: tariffKeyboard(user.id) });
      return;
    }
    const data = await getMirrorData(user.id);
    if (data.totalDraws === 0) {
      await vkSendMessage(vkUserId, "Пока нет истории — загляни через несколько дней.");
      return;
    }
    const lines = [`За последние ${data.windowDays} дней:`, ""];
    for (const a of data.topArchetypes) {
      lines.push(`• ${a.name} — ${a.count} раз(а)`);
    }
    if (canUserAccess(tariff, "MIRROR_FULL") && data.sphereTrends.length > 0) {
      lines.push("", "Тренды по сферам:");
      for (const trend of data.sphereTrends) lines.push(`• ${sphereLabel(trend.sphere)} — ${trend.count}`);
    }
    await vkSendMessage(vkUserId, lines.join("\n"));
    return;
  }

  if (trimmed.includes("Тариф")) {
    await vkSendMessage(vkUserId, `Твой тариф: ${tariff === "PREMIUM" ? "Премиум" : tariff === "STANDARD" ? "Стандарт" : "Бесплатный"}\nВыберите подходящий тариф — оплата откроется автоматически.`, { keyboard: tariffKeyboard(user.id) });
    return;
  }

  if (trimmed.includes("Купить колоду")) {
    await vkSendMessage(vkUserId, "Выберите покрытие: глянец — 9 000 ₽ или софт-тач — 10 500 ₽. Регистрация и привязка к веб-базе не нужны.", { keyboard: deckKeyboard(vkUserId) });
    return;
  }

  if (trimmed.includes("Консультация")) {
    await vkSendMessage(vkUserId, "Выберите формат:\n\nПремиум — консультация с основателем входит в подписку.\nРазовая консультация — отдельная встреча без подписки.", { keyboard: founderConsultationKeyboard(user.id) });
    return;
  }

  await vkSendMessage(vkUserId, `С возвращением, ${user.name}! Выбери действие на клавиатуре ниже.`, {
    keyboard: menuKeyboard(vkUserId),
  });
}
