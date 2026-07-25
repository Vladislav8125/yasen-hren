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
      <body className="min-h-full flex flex-col bg-void text-bone">{children}</body>
    </html>
  );
}
