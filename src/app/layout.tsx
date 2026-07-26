import type { Metadata } from "next";
import { Yeseva_One, PT_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Дизайн-язык — plans/2026-07-25-yasen-hren-tz-design.md, раздел 2.2:
// Yeseva One (имена архетипов, заголовки) · PT Serif (тело текста) · JetBrains Mono (технические подписи, UI)
const yesevaOne = Yeseva_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});

const ptSerif = PT_Serif({
  variable: "--font-body",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "cyrillic"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-technical",
  weight: ["400", "500", "700"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Ясен Хрен",
  description: "Ежедневная карта архетипа — быстрая психологическая гигиена.",
};

// Шапка убрана отсюда в редизайне (Фаза C, plans/2026-07-26-yasen-hren-redesign-light-cabinet.md):
// у публичных страниц свой каркас ((public)/layout.tsx), у личного
// кабинета — сайдбар ((cabinet)/layout.tsx), у лендинга (/) — вообще
// без шапки (полноэкранное видео). Здесь остаётся только то, что общее
// для всех: шрифты, фон, боковое окаймление.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${yesevaOne.variable} ${ptSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-void text-bone">
        {/* Боковое окаймление — по образцу вертикальной рамки физических карт
            (двойная золотая линия, узлы-шестерёнки, ягодная гроздь). Фиксировано
            по краям вьюпорта, decorative-only — не должно перехватывать клики. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-16 md:block"
          style={{ backgroundImage: "url(/patterns/side-border.svg)", backgroundRepeat: "repeat-y" }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-16 md:block"
          style={{
            backgroundImage: "url(/patterns/side-border.svg)",
            backgroundRepeat: "repeat-y",
            transform: "scaleX(-1)",
          }}
        />
        <div className="relative z-10 flex min-h-full flex-col md:px-16">{children}</div>
      </body>
    </html>
  );
}
