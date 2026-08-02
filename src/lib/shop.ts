import type { ShopProductId } from "@/generated/prisma/client";

// Магазин — Фаза D редизайна. Позиции жёстко заданы здесь, не в БД
// (см. schema.prisma, комментарий у ShopProductId) — отдельная CMS не
// нужна ради небольшого числа товаров.

export interface ShopProduct {
  id: ShopProductId;
  title: string;
  description: string;
  priceRub: number;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "CARDS",
    title: "Колода карт",
    description: "Обычная колода — 10 000 руб.; VIP-колода — 25 000 руб.",
    priceRub: 10000,
  },
  {
    id: "GAME",
    title: "Заказать игру",
    description: "Живая игра-практикум с колодой. В стоимость входит: поле, колоды, обучение.",
    priceRub: 150000,
  },
  {
    id: "CONSULTATION",
    title: "Личная консультация с Мастером",
    description: "Разбор с практикующим мастером — выберите специалиста.",
    priceRub: 8000,
  },
  {
    id: "CORPORATE",
    title: "Корпоративное мероприятие",
    description: "«Ясен Хрен» для корпоратива — психогигиена и командная динамика. От 100 000 ₽.",
    priceRub: 100000,
  },
  {
    id: "FOUNDER",
    title: "Консультация с основателями методики",
    description: "Личная встреча с создателями «Ясен Хрен».",
    priceRub: 15000,
  },
  {
    id: "CHALLENGE",
    title: "Челлендж по психогигиене",
    description: "21 день практики с картами. Ежедневные задания и поддержка.",
    priceRub: 10000,
  },
];

export function getShopProduct(id: ShopProductId): ShopProduct {
  const product = SHOP_PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown shop product: ${id}`);
  return product;
}
