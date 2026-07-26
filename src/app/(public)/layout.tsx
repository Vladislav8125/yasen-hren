import Link from "next/link";
import { auth } from "@/auth";

// Шапка для публичных страниц (глоссарий/вход/регистрация) — не для
// личного кабинета, у него свой каркас с сайдбаром (см. (cabinet)/layout.tsx).

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-void-border px-6 py-4">
        <Link href="/" className="font-display text-lg text-parchment-hi">
          ЯСЕН ХРЕН
        </Link>
        <nav className="flex items-center gap-4 font-technical text-xs uppercase tracking-widest">
          <Link href="/glossary" className="text-bone hover:text-gold-bright">
            Глоссарий
          </Link>
          {session?.user ? (
            <Link href="/today" className="text-gold hover:text-gold-bright">
              Личный кабинет
            </Link>
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
    </div>
  );
}
