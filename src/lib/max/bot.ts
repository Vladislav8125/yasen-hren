import type { Archetype, LifeSphere, Tariff } from "@/generated/prisma/client";
import { canUserAccess, effectiveTariffForChannel } from "@/lib/access";
import { addSecondaryCard, getOrCreateDailyDraw } from "@/lib/cardEngine";
import { maxAnswerCallback, maxSendMessage, type MaxButton } from "@/lib/max/api";
import { verifyMaxLinkToken } from "@/lib/maxLink";
import { createMaxLinkToken } from "@/lib/maxLink";
import { deckSelectionUrl } from "@/lib/direct-shop-token";
import { BOT_WELCOME, getOrCreateBotUser } from "@/lib/bot/guestUser";
import { prisma } from "@/lib/prisma";
import { grantPremiumTrial } from "@/lib/premium-trial";

type MaxUser = { user_id?: number; name?: string };
type MaxMessage = { sender?: MaxUser; body?: { text?: string | null } };
export type MaxUpdate = {
  update_type?: string;
  chat_id?: number;
  user?: MaxUser;
  payload?: string | null;
  message?: MaxMessage;
  callback?: { callback_id?: string; payload?: string; user?: MaxUser; message?: MaxMessage };
};

const appUrl = () => (process.env.APP_URL ?? "https://yasenhren.ru").replace(/\/+$/, "");
function menuButtons(maxUserId: string): MaxButton[][] {
  return [
    [{ type: "callback", text: "🃏 Получить карту дня", payload: "daily" }, { type: "callback", text: "📖 Подробнее", payload: "details" }],
    [{ type: "callback", text: "➕ Вторая карта", payload: "second" }, { type: "callback", text: "🪞 Зеркало", payload: "mirror" }],
    [{ type: "callback", text: "💳 Тариф", payload: "tariff" }, { type: "callback", text: "📅 Консультация", payload: "consultation" }],
    [{ type: "link", text: "🛒 Купить колоду", url: deckSelectionUrl(appUrl(), "max", maxUserId) }],
    [{ type: "callback", text: "🎁 Премиум на 10 дней", payload: "trial" }],
  ];
}
const SPHERES: MaxButton[][] = [
  [{ type: "callback", text: "💼 Дело", payload: "sphere:BUSINESS" }, { type: "callback", text: "❤️ Отношения", payload: "sphere:RELATIONS" }],
  [{ type: "callback", text: "🫀 Тело", payload: "sphere:HEALTH" }, { type: "callback", text: "☯️ Баланс", payload: "sphere:HARMONY" }],
  [{ type: "callback", text: "🎲 Случайная", payload: "sphere:random" }],
  [{ type: "callback", text: "◀️ Назад", payload: "menu" }],
];
const DETAIL_TABS = [
  { id: "why", label: "Почему выпала", heading: "ПОЧЕМУ ТЕБЕ ВЫПАЛА ЭТА КАРТА" },
  { id: "name", label: "Почему имя", heading: "ПОЧЕМУ ТАКОЕ ИМЯ" },
  { id: "where", label: "Где ты сейчас", heading: "ГДЕ ТЫ СЕЙЧАС" },
  { id: "meaning", label: "Что значит", heading: "ЧТО ЭТО ЗНАЧИТ" },
  { id: "reverse", label: "Обратная сторона", heading: "ОБРАТНАЯ СТОРОНА" },
] as const;
const DETAIL_BUTTONS: MaxButton[][] = [
  [{ type: "callback", text: "Почему выпала", payload: "details:why" }, { type: "callback", text: "Почему имя", payload: "details:name" }],
  [{ type: "callback", text: "Где ты сейчас", payload: "details:where" }, { type: "callback", text: "Что значит", payload: "details:meaning" }],
  [{ type: "callback", text: "Обратная сторона", payload: "details:reverse" }, { type: "callback", text: "◀️ В меню", payload: "menu" }],
];

function moscowCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
}

function incomingUserId(update: MaxUpdate): string | null {
  const id = update.user?.user_id ?? update.callback?.user?.user_id ?? update.message?.sender?.user_id;
  return typeof id === "number" ? String(id) : null;
}

function shortCaption(archetype: Pick<Archetype, "name" | "tagline" | "property" | "essence" | "clinicalFlag">) {
  const lines = [archetype.name, `«${archetype.tagline}»`, ""];
  if (archetype.property) lines.push(`Свойство: ${archetype.property}`);
  lines.push(`Суть: ${archetype.essence}`);
  if (archetype.clinicalFlag) lines.push("", `⚠ ${archetype.clinicalFlag}`);
  return lines.join("\n");
}

function tariffPaymentKeyboard(userId: string) {
  const token = encodeURIComponent(createMaxLinkToken(userId));
  return [[
    { type: "link", text: "Стандарт · 590 ₽", url: `${appUrl()}/api/max/payment?token=${token}&tariff=STANDARD` },
    { type: "link", text: "Премиум · 3 500 ₽", url: `${appUrl()}/api/max/payment?token=${token}&tariff=PREMIUM` },
  ]] satisfies MaxButton[][];
}

function premiumPaymentKeyboard(userId: string) {
  const token = encodeURIComponent(createMaxLinkToken(userId));
  return [[{ type: "link", text: "Оформить Премиум · 3 500 ₽", url: `${appUrl()}/api/max/payment?token=${token}&tariff=PREMIUM` }]] satisfies MaxButton[][];
}

function founderConsultationKeyboard(userId: string) {
  const token = encodeURIComponent(createMaxLinkToken(userId));
  return [[
    { type: "link", text: "Премиум · консультация включена", url: `${appUrl()}/api/max/payment?token=${token}&tariff=PREMIUM` },
    { type: "link", text: "Разовая консультация", url: `${appUrl()}/shop/checkout?product=FOUNDER` },
  ]] satisfies MaxButton[][];
}

function deckPaymentKeyboard(maxUserId: string) {
  return [[{ type: "link", text: "Купить колоду", url: deckSelectionUrl(appUrl(), "max", maxUserId) }]] satisfies MaxButton[][];
}

function detailText(archetype: Archetype, tabId: (typeof DETAIL_TABS)[number]["id"]) {
  const tab = DETAIL_TABS.find((item) => item.id === tabId)!;
  const lines = (archetype.extendedDescription ?? "").replace(/\r/g, "").split("\n");
  const headingIndex = lines.findIndex((line) => line.trim().toUpperCase().replace(/[.:]$/, "") === tab.heading);
  const nextHeadingIndex = headingIndex < 0 ? -1 : lines.findIndex((line, index) => index > headingIndex && DETAIL_TABS.some((item) => line.trim().toUpperCase().replace(/[.:]$/, "") === item.heading && item.id !== tabId));
  const content = headingIndex >= 0
    ? lines.slice(headingIndex + 1, nextHeadingIndex < 0 ? lines.length : nextHeadingIndex).join("\n").trim()
    : "";
  const fallback: Record<(typeof DETAIL_TABS)[number]["id"], string> = {
    why: archetype.function || archetype.essence,
    name: [archetype.tagline && `«${archetype.tagline}»`, archetype.archetypeType].filter(Boolean).join("\n\n"),
    where: archetype.inLife || archetype.essence,
    meaning: archetype.essence,
    reverse: archetype.shadowSide || "У этой карты нет отдельного описания обратной стороны.",
  };
  const selectedText = content || fallback[tabId] || "Для этого раздела пока нет отдельного текста.";
  const formatted = selectedText.replace(/^(\s*)(?:•|—)\s+/gm, "$1- ").split("\n").map((line) => {
    const trimmed = line.trim();
    const letters = trimmed.replace(/[^\p{L}]/gu, "");
    return letters.length > 4 && letters === letters.toUpperCase() ? `### ${trimmed}` : line;
  }).join("\n");
  const tagline = archetype.tagline ? `> «${archetype.tagline}»\n\n` : "";
  const flag = archetype.clinicalFlag ? `\n\n> ⚠ ${archetype.clinicalFlag}` : "";
  return `# ${archetype.name}\n${tagline}## ${tab.label}\n\n${formatted}${flag}`;
}

async function sendText(userId: string, text: string, buttons?: MaxButton[][], format?: "markdown" | "html") {
  const chunks = text.match(/[\s\S]{1,3900}/g) ?? [text];
  for (let i = 0; i < chunks.length; i += 1) {
    await maxSendMessage(userId, chunks[i], i === chunks.length - 1 ? { buttons, format } : { format });
  }
}

async function sendCard(userId: string, archetype: Archetype, label?: string) {
  const buttons: MaxButton[][] = archetype.imageUrl
    ? [[{ type: "link", text: "Открыть изображение карты", url: `${appUrl()}${archetype.imageUrl}` }]]
    : [];
  await maxSendMessage(userId, `${label ? `${label}\n\n` : ""}${shortCaption(archetype)}`, { buttons: buttons.length ? buttons : undefined });
}

async function findUser(maxUserId: string) {
  return prisma.user.findUnique({ where: { maxUserId } });
}

async function recordVisitAndMaybeOfferDeck(maxUserId: string) {
  try {
    const chatId = `max:${maxUserId}`;
    const date = moscowCalendarDate();
    await prisma.telegramBotVisit.upsert({
      where: { chatId_date: { chatId, date } }, create: { chatId, date }, update: {},
    });
    const firstDay = new Date(date);
    firstDay.setUTCDate(firstDay.getUTCDate() - 9);
    const visits = await prisma.telegramBotVisit.count({ where: { chatId, date: { gte: firstDay, lte: date } } });
    if (visits !== 10) return;
    const claim = await prisma.telegramDeckOffer.createMany({ data: [{ chatId }], skipDuplicates: true });
    if (claim.count === 0) return;
    try {
      await maxSendMessage(maxUserId, "🃏 10 дней подряд — вот это привычка!\n\nКарты «Ясен Хрен» есть и в физической версии. Выберите глянец или софт-тач:", { buttons: deckPaymentKeyboard(maxUserId) });
      await prisma.telegramDeckOffer.update({ where: { chatId }, data: { sentAt: new Date() } });
    } catch (error) {
      await prisma.telegramDeckOffer.deleteMany({ where: { chatId, sentAt: null } });
      throw error;
    }
  } catch (error) {
    console.error("MAX visit streak could not be processed", error);
  }
}

async function showMenu(maxUserId: string, name?: string) {
  await maxSendMessage(maxUserId, `Выбери действие${name ? `, ${name}` : ""}:`, { buttons: menuButtons(maxUserId) });
}

async function startUser(maxUserId: string, payload?: string | null, name?: string) {
  const linkedId = payload ? verifyMaxLinkToken(payload) : null;
  if (linkedId) {
    await prisma.user.update({ where: { id: linkedId }, data: { maxUserId, preferredChannel: "MAX" } });
    await maxSendMessage(maxUserId, "Готово, аккаунт привязан к MAX. Теперь карта дня будет доступна здесь.", { buttons: menuButtons(maxUserId) });
    return;
  }
  const { user, created } = await getOrCreateBotUser("MAX", maxUserId, name);
  await maxSendMessage(maxUserId, created ? BOT_WELCOME : `👋 С возвращением, ${user.name}! Нажми «🃏 Получить карту дня» или выбери другое действие.`, { buttons: menuButtons(maxUserId) });
}

async function action(maxUserId: string, value: string) {
  const user = await findUser(maxUserId);
  if (!user) return void (await startUser(maxUserId));
  const tariff = await effectiveTariffForChannel(user, "MAX");
  if (value === "menu") return void (await showMenu(maxUserId, user.name));
  if (value === "daily") {
    const draw = await getOrCreateDailyDraw({ userId: user.id, channel: "MAX", wantsSecondary: false });
    await sendCard(maxUserId, draw.primaryArchetype);
    if (draw.secondaryArchetype) await sendCard(maxUserId, draw.secondaryArchetype, "Вторая карта");
    if (draw.pathArchetype) await sendCard(maxUserId, draw.pathArchetype, "Карта Пути · раз в неделю");
    return void (await showMenu(maxUserId));
  }
  if (value === "details") {
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) return void (await maxSendMessage(maxUserId, "Развёрнутое описание доступно с платным тарифом. Выбери подходящий:", { buttons: tariffPaymentKeyboard(user.id) }));
    return void (await maxSendMessage(maxUserId, "Выбери раздел разбора карты. Каждый откроется отдельным сообщением — так его удобнее читать на телефоне.", { buttons: DETAIL_BUTTONS }));
  }
  if (value.startsWith("details:")) {
    if (!canUserAccess(tariff, "EXTENDED_CARD_CONTENT")) return void (await maxSendMessage(maxUserId, "Развёрнутое описание доступно с платным тарифом. Выбери подходящий:", { buttons: tariffPaymentKeyboard(user.id) }));
    const tabId = value.slice("details:".length) as (typeof DETAIL_TABS)[number]["id"];
    if (!DETAIL_TABS.some((item) => item.id === tabId)) return void (await showMenu(maxUserId));
    const draw = await getOrCreateDailyDraw({ userId: user.id, channel: "MAX", wantsSecondary: false });
    return void (await sendText(maxUserId, detailText(draw.primaryArchetype, tabId), DETAIL_BUTTONS, "markdown"));
  }
  if (value === "second") {
    if (!canUserAccess(tariff, "SECOND_CARD")) return void (await maxSendMessage(maxUserId, "Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { buttons: premiumPaymentKeyboard(user.id) }));
    const draw = await getOrCreateDailyDraw({ userId: user.id, channel: "MAX", wantsSecondary: false });
    if (draw.secondaryArchetype) return void (await maxSendMessage(maxUserId, "Вторая карта уже выбрана на сегодня.", { buttons: menuButtons(maxUserId) }));
    return void (await maxSendMessage(maxUserId, "Выбери сферу жизни для второй карты:", { buttons: SPHERES }));
  }
  if (value.startsWith("sphere:")) {
    if (!canUserAccess(tariff, "SECOND_CARD")) return void (await maxSendMessage(maxUserId, "Вторая карта доступна на тарифе «Премиум». Оформи его, чтобы открыть вторую карту:", { buttons: premiumPaymentKeyboard(user.id) }));
    const selected = value.slice(7);
    const sphere = selected === "random" ? undefined : (selected as LifeSphere);
    await getOrCreateDailyDraw({ userId: user.id, channel: "MAX", wantsSecondary: false });
    const draw = await addSecondaryCard({ userId: user.id, secondaryMode: sphere ? "sphere" : "random", sphere });
    if (draw.secondaryArchetype) await sendCard(maxUserId, draw.secondaryArchetype, "Вторая карта");
    return void (await showMenu(maxUserId));
  }
  if (value === "mirror") {
    if (!canUserAccess(tariff, "MIRROR")) return void (await maxSendMessage(maxUserId, "Зеркало доступно с платным тарифом. Выбери подходящий:", { buttons: tariffPaymentKeyboard(user.id) }));
    const { getMirrorData } = await import("@/lib/mirror");
    const data = await getMirrorData(user.id);
    if (data.totalDraws === 0) return void (await maxSendMessage(maxUserId, "Пока нет истории — загляни через несколько дней.", { buttons: menuButtons(maxUserId) }));
    return void (await sendText(maxUserId, [`За последние ${data.windowDays} дней:`, "", ...data.topArchetypes.map((item) => `• ${item.name} — ${item.count} раз(а)`)].join("\n"), menuButtons(maxUserId)));
  }
  if (value === "tariff") return void (await maxSendMessage(maxUserId, `Твой тариф: ${tariff}\n\nВыбери тариф — откроется Robokassa. После подтверждения оплаты доступ включится автоматически.`, { buttons: tariffPaymentKeyboard(user.id) }));
  if (value === "deck") return void (await maxSendMessage(maxUserId, "🛒 Выберите покрытие: глянец — 9 000 ₽ или софт-тач — 10 500 ₽. Регистрация и привязка к веб-базе не нужны.", { buttons: deckPaymentKeyboard(maxUserId) }));
  if (value === "trial") {
    const result = await grantPremiumTrial(user.id, "MAX");
    if (result.granted) return void (await maxSendMessage(maxUserId, `🎁 Премиум активен на 10 дней — до ${result.expiresAt.toLocaleDateString("ru-RU")}.`, { buttons: menuButtons(maxUserId) }));
    if (result.reason === "premium-active") return void (await maxSendMessage(maxUserId, "✨ Тариф «Премиум» уже активен.", { buttons: menuButtons(maxUserId) }));
    return void (await maxSendMessage(maxUserId, "🎁 Пробный тариф «Премиум» уже был активирован для этого аккаунта. Выбери подходящий тариф:", { buttons: tariffPaymentKeyboard(user.id) }));
  }
  if (value === "consultation") {
    return void (await maxSendMessage(maxUserId, "Выберите формат:\n\nПремиум — консультация с основателем входит в подписку.\nРазовая консультация — отдельная встреча без подписки.", { buttons: founderConsultationKeyboard(user.id) }));
  }
  await showMenu(maxUserId, user.name);
}

export async function handleMaxUpdate(update: MaxUpdate) {
  const maxUserId = incomingUserId(update);
  if (!maxUserId) return;
  const countable = update.update_type === "bot_started" || update.update_type === "message_callback" || update.update_type === "message_created";
  if (update.update_type === "bot_started") {
    await startUser(maxUserId, update.payload, update.user?.name);
    if (countable) await recordVisitAndMaybeOfferDeck(maxUserId);
    return;
  }
  if (update.update_type === "message_callback") {
    if (update.callback?.payload) await action(maxUserId, update.callback.payload);
    if (update.callback?.callback_id) await maxAnswerCallback(update.callback.callback_id, "Готово").catch(() => undefined);
    if (countable) await recordVisitAndMaybeOfferDeck(maxUserId);
    return;
  }
  if (update.update_type === "message_created") {
    const text = update.message?.body?.text?.trim() ?? "";
    if (text === "/start" || text.toLowerCase() === "старт") {
      await startUser(maxUserId, undefined, update.user?.name);
      if (countable) await recordVisitAndMaybeOfferDeck(maxUserId);
      return;
    }
    const actions: Record<string, string> = {
      "🃏 получить карту дня": "daily", "🃏 карта дня": "daily", "📖 подробнее": "details", "➕ вторая карта": "second",
      "🪞 зеркало": "mirror", "💳 тариф": "tariff", "📅 консультация": "consultation",
      "🛒 купить колоду": "deck", "🛒 колода софт-тач": "deck", "🎁 premium на 10 дней": "trial",
    };
    await action(maxUserId, actions[text.toLowerCase()] ?? "menu");
    if (countable) await recordVisitAndMaybeOfferDeck(maxUserId);
  }
}
