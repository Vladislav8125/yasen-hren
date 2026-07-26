import type { ShopProductId } from "@/generated/prisma/client";

// Магазин — Фаза D редизайна. 4 позиции жёстко заданы здесь, не в БД
// (см. schema.prisma, комментарий у ShopProductId) — отдельная CMS не
// нужна ради четырёх товаров. Цена — плейсхолдер 1 ₽ у всех (владелец:
// "потом будем смотреть и менять, когда подключим ЮKassa").

export interface ShopProduct {
  id: ShopProductId;
  title: string;
  description: string;
  priceRub: number;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "CARDS",
    title: "Карты",
    description: "Печатная колода «Ясен Хрен» — все 4 семьи архетипов, в руки, не только на экране.",
    priceRub: 1,
  },
  {
    id: "GAME",
    title: "Заказать игру",
    description: "Живая игра-практикум с колодой «Ясен Хрен» — для своей команды или группы.",
    priceRub: 1,
  },
  {
    id: "CONSULTATION",
    title: "Личная консультация с психологом",
    description: "Разбор с практикующим психологом — выберите специалиста из доступных карточек.",
    priceRub: 1,
  },
  {
    id: "CORPORATE",
    title: "Корпоративное мероприятие",
    description: "«Ясен Хрен» как формат для корпоратива — психогигиена и командная динамика вместе.",
    priceRub: 1,
  },
];

export function getShopProduct(id: ShopProductId): ShopProduct {
  const product = SHOP_PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown shop product: ${id}`);
  return product;
}
