import type { Metadata } from "next";
import { Yeseva_One, PT_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LegalFooter } from "@/components/LegalFooter";

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
// для всех: шрифты и единый пергаментный фон.
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
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
          <div className="mt-auto">
            <LegalFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
