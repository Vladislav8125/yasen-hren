import type { Tariff } from "@/generated/prisma/client";

// Единая точка проверки доступа — архитектурное ТЗ, раздел 4:
// "не «если tariff == PREMIUM» разбросано по коду, а один сервис
// core/access.ts, у которого один вход". Если условия тарифа изменятся —
// правится один файл, а не каждый экран по отдельности.

export type Feature =
  | "EXTENDED_CARD_CONTENT" // развёрнутое описание + инструкция на карте
  | "SECOND_CARD" // 2-я карта дня + выбор сферы
  | "MIRROR" // базовое «Зеркало» (топ-3 архетипа)
  | "MIRROR_FULL" // полное «Зеркало» (тренды по сферам)
  | "CONSULTATION"; // консультация с основателем, 1 раз/мес

const RULES: Record<Feature, Tariff[]> = {
  EXTENDED_CARD_CONTENT: ["STANDARD", "PREMIUM"],
  SECOND_CARD: ["PREMIUM"],
  MIRROR: ["STANDARD", "PREMIUM"],
  MIRROR_FULL: ["PREMIUM"],
  CONSULTATION: ["PREMIUM"],
};

export function canUserAccess(tariff: Tariff, feature: Feature): boolean {
  return RULES[feature].includes(tariff);
}

/**
 * Платный тариф без даты окончания или с истёкшей датой считается
 * невалидным — эффективно пользователь работает как Free, пока не
 * продлит подписку (проверка "на лету" при заходе, без отдельного крона
 * — архитектурное ТЗ, раздел 8).
 */
export function isTariffActive(user: { tariff: Tariff; tariffExpiresAt: Date | null }): boolean {
  if (user.tariff === "FREE") return true;
  if (!user.tariffExpiresAt) return false;
  return user.tariffExpiresAt.getTime() > Date.now();
}

export function effectiveTariff(user: { tariff: Tariff; tariffExpiresAt: Date | null }): Tariff {
  return isTariffActive(user) ? user.tariff : "FREE";
}
