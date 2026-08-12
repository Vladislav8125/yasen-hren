import path from "path";
import { prisma } from "@/lib/prisma";
import { addSecondaryCard, getOrCreateDailyDraw } from "@/lib/cardEngine";
import type { Archetype, LifeSphere } from "@/generated/prisma/client";
import { getMirrorData } from "@/lib/mirror";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { verifyVkLinkToken } from "@/lib/vkLink";
import { vkSendMessage, vkUploadPhoto } from "./api";

// VK-бот — фасад поверх того же core-слоя, что и Telegram (src/lib/telegram/bot.ts):
// карточный движок, доступ по тарифу, зеркало переиспользуются один в один,
// ничего не дублируется (архитектурное ТЗ, раздел 10).

const MENU_KEYBOARD = JSON.stringify({
  one_time: false,
  buttons: [
    [{ action: { type: "text", label: "🃏 Карта дня" }, color: "primary" }],
    [
      { action: { type: "text", label: "📖 Подробнее" }, color: "secondary" },
      { action: { type: "text", label: "➕ Вторая карта" }, color: "secondary" },
    ],
    [{ action: { type: "text", label: "🪞 Зеркало" }, color: "secondary" }],
    [{ action: { type: "text", label: "💳 Тариф" }, color: "secondary" }],
  ],
});

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

async function findLinkedUser(vkUserId: string) {
  return prisma.user.findUnique({ where: { vkUserId } });
}

function shortCaption(archetype: {
  name: string;
  tagline: string;
  property: string | null;
  essence: string;
  clinicalFlag: string | null;
}) {
  const lines = [archetype.name, `«${archetype.tagline}»`, ""];
  if (archetype.property) lines.push(`Свойство: ${archetype.property}`);
  lines.push(`Суть: ${archetype.essence}`);
  if (archetype.clinicalFlag) lines.push("", `⚠ ${archetype.clinicalFlag}`);
  return lines.join("\n");
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
  return getOrCreateDailyDraw({ userId, channel: "VK", wantsSecondary: false });
}

async function sendArchetype(
  vkUserId: string,
  archetype: { name: string; tagline: string; property: string | null; essence: string; clinicalFlag: string | null; imageUrl: string | null },
  label?: string,
) {
  const caption = `${label ? `${label}\n\n` : ""}${shortCaption(archetype)}`;
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
}

/** Обрабатывает одно входящее сообщение VK Callback API (`message_new`). */
export async function handleVkMessage(vkUserId: string, text: string) {
  const trimmed = text.trim();

  const linkedUserId = verifyVkLinkToken(trimmed);
  if (linkedUserId) {
    await prisma.user.update({ where: { id: linkedUserId }, data: { vkUserId } });
    await vkSendMessage(vkUserId, "Готово, аккаунт привязан! Жми «Карта дня», когда будешь готов.", {
      keyboard: MENU_KEYBOARD,
    });
    return;
  }

  const user = await findLinkedUser(vkUserId);
  if (!user) {
    await vkSendMessage(
      vkUserId,
      "Привет! Я — Ясен Хрен. Чтобы получать карту дня здесь, привяжи аккаунт: зайди в личный кабинет на сайте и нажми «Привязать VK».",
    );
    return;
  }

  const tariff = effectiveTariff(user);

  if (trimmed.includes("Карта дня")) {
    const draw = await todayDraw(user.id);
    await sendArchetype(vkUserId, draw.primaryArchetype);
    if (draw.secondaryArchetype) {
      await sendArchetype(vkUserId, draw.secondaryArchetype, "Вторая карта");
    }
    if (draw.pathArchetype) {
      await sendArchetype(vkUserId, draw.pathArchetype, "Карта Пути · раз в неделю");
    }
    await vkSendMessage(vkUserId, "Выбери действие:", { keyboard: MENU_KEYBOARD });
    return;
  }

  if (trimmed.includes("Подробнее")) {
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) {
      await vkSendMessage(vkUserId, `Развёрнутое описание доступно со Standard. Оформить: ${appUrl()}/tariffs`, { keyboard: MENU_KEYBOARD });
      return;
    }
    const draw = await todayDraw(user.id);
    await vkSendMessage(vkUserId, extendedText(draw.primaryArchetype), { keyboard: MENU_KEYBOARD });
    return;
  }

  if (trimmed.includes("Вторая карта")) {
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await vkSendMessage(vkUserId, `Вторая карта доступна на Premium. Оформить: ${appUrl()}/tariffs`, { keyboard: MENU_KEYBOARD });
      return;
    }
    const draw = await todayDraw(user.id);
    if (draw.secondaryArchetype) {
      await vkSendMessage(vkUserId, "Вторая карта уже выбрана на сегодня.", { keyboard: MENU_KEYBOARD });
      return;
    }
    await vkSendMessage(vkUserId, "Выбери сферу жизни для второй карты:", { keyboard: SPHERE_KEYBOARD });
    return;
  }

  if (Object.prototype.hasOwnProperty.call(SPHERE_CHOICES, trimmed)) {
    if (!canUserAccess(tariff, "SECOND_CARD")) {
      await vkSendMessage(vkUserId, `Вторая карта доступна на Premium. Оформить: ${appUrl()}/tariffs`, { keyboard: MENU_KEYBOARD });
      return;
    }
    const sphere = SPHERE_CHOICES[trimmed];
    const draw = await addSecondaryCard({
      userId: user.id,
      secondaryMode: sphere ? "sphere" : "random",
      sphere,
    });
    if (draw.secondaryArchetype) await sendArchetype(vkUserId, draw.secondaryArchetype, "Вторая карта");
    await vkSendMessage(vkUserId, "Выбери действие:", { keyboard: MENU_KEYBOARD });
    return;
  }

  if (trimmed.includes("Назад")) {
    await vkSendMessage(vkUserId, "Выбери действие:", { keyboard: MENU_KEYBOARD });
    return;
  }

  if (trimmed.includes("Зеркало")) {
    if (!canUserAccess(tariff, "MIRROR")) {
      await vkSendMessage(vkUserId, `Зеркало доступно со Standard. Оформить: ${appUrl()}/tariffs`);
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
    await vkSendMessage(vkUserId, lines.join("\n"));
    return;
  }

  if (trimmed.includes("Тариф")) {
    await vkSendMessage(vkUserId, `Твой тариф: ${tariff}\nУправление: ${appUrl()}/tariffs`);
    return;
  }

  await vkSendMessage(vkUserId, `С возвращением, ${user.name}! Выбери действие на клавиатуре ниже.`, {
    keyboard: MENU_KEYBOARD,
  });
}
