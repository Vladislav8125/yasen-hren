import type { Metadata } from "next";
import Link from "next/link";
import { Yeseva_One, PT_Serif, JetBrains_Mono } from "next/font/google";
import { auth, signOut } from "@/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="ru"
      className={`${yesevaOne.variable} ${ptSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-bone">
        <header className="flex items-center justify-between border-b border-void-border px-6 py-4">
          <Link href="/" className="font-display text-lg text-parchment-hi">
            ЯСЕН ХРЕН
          </Link>
          <nav className="flex items-center gap-4 font-technical text-xs uppercase tracking-widest">
            {/* Глоссарий — открытое пространство, доступен всем независимо от входа/тарифа */}
            <Link href="/glossary" className="text-bone hover:text-gold-bright">
              Глоссарий
            </Link>
            {session?.user ? (
              <div className="flex items-center gap-4">
                <Link href="/today" className="text-gold hover:text-gold-bright">
                  Карта дня
                </Link>
                <Link href="/mirror" className="text-bone hover:text-gold-bright">
                  Зеркало
                </Link>
                <Link href="/assistant" className="text-bone hover:text-gold-bright">
                  Спросить
                </Link>
                <Link href="/tariffs" className="text-bone hover:text-gold-bright">
                  Тарифы
                </Link>
                <Link href="/profile" className="text-bone hover:text-gold-bright">
                  {session.user.name}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="text-bone-dim hover:text-red-warning">
                    Выйти
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-bone hover:text-gold-bright">
                  Войти
                </Link>
                <Link href="/register" className="text-gold hover:text-gold-bright">
                  Регистрация
                </Link>
              </div>
            )}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
