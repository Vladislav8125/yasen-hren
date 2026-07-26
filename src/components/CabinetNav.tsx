"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Иконки — простые линейные (не 3D, как у референса GRO): у нас уже есть
// свой визуальный язык (иллюстрации карт, орнамент), два разных стиля
// иконок в одном интерфейсе спорили бы друг с другом.

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  card: (
    <Icon>
      <rect x="4" y="2" width="12" height="16" rx="2" />
      <path d="M7 6h6M7 10h6M7 14h3" />
    </Icon>
  ),
  mirror: (
    <Icon>
      <ellipse cx="10" cy="8" rx="6" ry="7" />
      <path d="M10 15v3M7 18h6" />
    </Icon>
  ),
  shop: (
    <Icon>
      <path d="M5 7h10l-1 10H6L5 7z" />
      <path d="M7 7V5.5a3 3 0 016 0V7" />
    </Icon>
  ),
  ask: (
    <Icon>
      <path d="M3 4.5h14v9H8l-4 4v-4H3v-9z" />
    </Icon>
  ),
  tariff: (
    <Icon>
      <path d="M3 3h7l7 7-7 7-7-7V3z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  book: (
    <Icon>
      <rect x="3" y="3" width="14" height="14" rx="1" />
      <path d="M10 3v14" />
    </Icon>
  ),
  user: (
    <Icon>
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </Icon>
  ),
};

const ITEMS: { href: string; label: string; icon: keyof typeof ICONS }[] = [
  { href: "/today", label: "Карта дня", icon: "card" },
  { href: "/mirror", label: "Зеркало", icon: "mirror" },
  { href: "/shop", label: "Магазин", icon: "shop" },
  { href: "/assistant", label: "Спросить", icon: "ask" },
  { href: "/tariffs", label: "Тарифы", icon: "tariff" },
  { href: "/glossary", label: "Глоссарий", icon: "book" },
  { href: "/profile", label: "Профиль", icon: "user" },
];

export function CabinetNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 font-technical text-xs uppercase tracking-widest whitespace-nowrap ${
              active ? "bg-gold/15 text-gold-bright" : "text-bone-dim hover:bg-gold/10 hover:text-bone"
            }`}
          >
            {ICONS[item.icon]}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
