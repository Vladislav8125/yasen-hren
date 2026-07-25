import path from "path";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
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
    [{ action: { type: "text", label: "🪞 Зеркало" }, color: "secondary" }],
    [{ action: { type: "text", label: "💳 Тариф" }, color: "secondary" }],
  ],
});

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

async function sendArchetype(
  vkUserId: string,
  archetype: { name: string; tagline: string; property: string | null; essence: string; clinicalFlag: string | null; imageUrl: string | null },
) {
  const caption = shortCaption(archetype);
  if (archetype.imageUrl) {
    const filePath = path.join(process.cwd(), "public", archetype.imageUrl);
    const attachment = await vkUploadPhoto(vkUserId, filePath);
    await vkSendMessage(vkUserId, caption, { attachment });
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
    const draw = await getOrCreateDailyDraw({
      userId: user.id,
      channel: "VK",
      wantsSecondary: canUserAccess(tariff, "SECOND_CARD"),
    });
    await sendArchetype(vkUserId, draw.primaryArchetype);
    if (draw.secondaryArchetype) {
      await sendArchetype(vkUserId, draw.secondaryArchetype);
    }
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
