export type PublicShopProductId =
  | "CARDS"
  | "GAME"
  | "CONSULTATION"
  | "CORPORATE"
  | "FOUNDER"
  | "CHALLENGE"
  | "MERCH";

export type CardDeckVariant = "GLOSS" | "SOFT_TOUCH";

export type PublicShopProduct = {
  id: PublicShopProductId;
  slug: string;
  variant?: CardDeckVariant;
  category: "Карты" | "Консультации";
  title: string;
  priceRub: number;
  partnerPriceRub?: number;
  format: string;
  image: string;
  requiresDelivery?: boolean;
  shortDescription: string;
  description: string;
  includes: string[];
};

export type PlatformProduct = {
  id: "platform-free" | "platform-standard" | "platform-premium";
  tariff: "FREE" | "STANDARD" | "PREMIUM";
  category: "Платформа";
  title: string;
  priceLabel: string;
  format: string;
  image: string;
  shortDescription: string;
  description: string;
  includes: string[];
  href: string;
};

// На публичной витрине оставлены только позиции из кабинета партнёра.
// Две версии колоды используют одну ShopProductId=CARDS, а вариант хранения
// фиксируется отдельным полем variant в заказе.
export const PUBLIC_SHOP_PRODUCTS: PublicShopProduct[] = [
  {
    id: "CARDS", slug: "cards-gloss", variant: "GLOSS", category: "Карты",
    title: "Колода «Ясен Хрен» — глянец", priceRub: 9_000, format: "Физический товар",
    image: "/shop/cards-deck.png", requiresDelivery: true,
    shortDescription: "Глянцевая версия авторской колоды для самостоятельной практики и живых разговоров.",
    description: "Колода помогает заметить повторяющиеся сюжеты, назвать то, что обычно остаётся без слов, и выбрать следующий шаг. Это не гадание, а инструмент внимательного разговора с собой.",
    includes: ["Полная колода карт", "Глянцевое покрытие", "Коробка для хранения", "Инструкция по началу практики"],
  },
  {
    id: "CARDS", slug: "cards-soft-touch", variant: "SOFT_TOUCH", category: "Карты",
    title: "Колода «Ясен Хрен» — софт тач", priceRub: 10_500, format: "Физический товар",
    image: "/shop/cards-deck.png", requiresDelivery: true,
    shortDescription: "Премиальная версия колоды с мягким покрытием — для регулярной практики и подарка.",
    description: "Те же карты и методика в тактильно приятном исполнении. Выберите образ, назовите происходящее и переведите наблюдение в один реальный шаг.",
    includes: ["Полная колода карт", "Покрытие софт тач", "Коробка для хранения", "Инструкция по началу практики"],
  },
  {
    id: "FOUNDER", slug: "founder", category: "Консультации", title: "Встреча с основателем",
    priceRub: 15_000, format: "Онлайн", image: "/shop/founder.png",
    shortDescription: "Авторская встреча для тех, кому нужен взгляд изнутри метода «Ясен Хрен».",
    description: "Персональная встреча с основателем проекта: разбор ситуации, работа с образом и выбор направления, которое действительно можно реализовать.",
    includes: ["Подготовка к встрече", "Авторская консультация", "Персональные ориентиры после разговора"],
  },
];

export const PLATFORM_PRODUCTS: PlatformProduct[] = [
  {
    id: "platform-free", tariff: "FREE", category: "Платформа", title: "Платформа «Ясен Хрен» — Бесплатный",
    priceLabel: "0 ₽", format: "Веб · Telegram · VK", image: "/shop/challenge.png",
    shortDescription: "Одна карта в день, чтобы начать замечать состояние и выбирать следующий шаг.",
    description: "Регистрация открывает ежедневную карту и базовый личный кабинет. Никаких предсказаний и обязательств — только короткая практика на сегодня.",
    includes: ["1 карта в день", "Короткое описание карты", "Глоссарий", "Веб, Telegram и VK"], href: "/register?tariff=FREE",
  },
  {
    id: "platform-standard", tariff: "STANDARD", category: "Платформа", title: "Платформа «Ясен Хрен» — Стандарт",
    priceLabel: "590 ₽ / месяц", format: "Подписка", image: "/shop/challenge.png",
    shortDescription: "Развёрнутое описание и базовое «Зеркало» для регулярной самостоятельной работы.",
    description: "Тариф «Стандарт» добавляет глубину к ежедневной карте: расширенное описание, историю и базовую статистику. После регистрации тариф можно оплатить в личном кабинете.",
    includes: ["1 карта в день", "Развёрнутое описание", "Базовое «Зеркало»", "Веб-база и один выбранный бот"], href: "/register?tariff=STANDARD",
  },
  {
    id: "platform-premium", tariff: "PREMIUM", category: "Платформа", title: "Платформа «Ясен Хрен» — Премиум",
    priceLabel: "3 500 ₽ / месяц", format: "Подписка", image: "/shop/challenge.png",
    shortDescription: "Две карты в день, выбор сферы, полное «Зеркало» и встреча с основателем каждый месяц.",
    description: "Тариф «Премиум» открывает полный маршрут работы с картами. После регистрации можно сразу выбрать тариф и перейти к оплате в личном кабинете.",
    includes: ["2 карты в день", "Выбор сферы для второй карты", "Полное «Зеркало»", "Консультация с основателем раз в месяц"], href: "/register?tariff=PREMIUM",
  },
];

// Старые позиции сохраняем для совместимости с уже созданными заказами и
// внутренними ссылками. Они намеренно не экспортируются в каталог магазина.
export const LEGACY_PUBLIC_SHOP_PRODUCTS: PublicShopProduct[] = [
  { id: "GAME", slug: "game", category: "Карты", title: "Проведение игры", priceRub: 150_000, format: "Офлайн / по согласованию", image: "/shop/game.png", shortDescription: "Групповая игра с картами и фасилитацией.", description: "Формат для открытых групп и камерных событий.", includes: ["Подготовка сценария", "Ведущий игры"] },
  { id: "CONSULTATION", slug: "consultation", category: "Консультации", title: "Индивидуальная консультация", priceRub: 8_000, format: "Онлайн", image: "/shop/consultation.png", shortDescription: "Личная встреча для разбора запроса.", description: "Спокойный разговор один на один.", includes: ["Уточнение запроса", "Онлайн-встреча"] },
  { id: "CORPORATE", slug: "corporate", category: "Карты", title: "Корпоративная игра", priceRub: 100_000, format: "Для команды", image: "/shop/corporate.png", shortDescription: "Фасилитированный формат для команд.", description: "Игра помогает команде обсудить роли и решения.", includes: ["Брифинг", "Проведение для команды"] },
  { id: "CHALLENGE", slug: "challenge", category: "Карты", title: "Практический челлендж", priceRub: 10_000, format: "Онлайн-программа", image: "/shop/challenge.png", shortDescription: "Последовательная практика для регулярного действия.", description: "Программа с заданиями и вопросами.", includes: ["Маршрут практики", "Задания"] },
  { id: "MERCH", slug: "merch", category: "Карты", title: "Мерч «Ясен Хрен»", priceRub: 3_000, format: "Физический товар", image: "/shop/merch.png", requiresDelivery: true, shortDescription: "Предметы с мотивами проекта.", description: "Лимитированные предметы проекта.", includes: ["Выбранная позиция", "Упаковка"] },
];

export function findPublicShopProduct(id: string, variant?: string) {
  const normalizedVariant = variant === "SOFT_TOUCH" ? "SOFT_TOUCH" : "GLOSS";
  return PUBLIC_SHOP_PRODUCTS.find((product) => product.id === id && (product.id !== "CARDS" || product.variant === normalizedVariant));
}

export function checkoutHref(product: PublicShopProduct) {
  const params = new URLSearchParams({ product: product.id });
  if (product.variant) params.set("variant", product.variant);
  return `/shop/checkout?${params.toString()}`;
}

export const rub = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;
