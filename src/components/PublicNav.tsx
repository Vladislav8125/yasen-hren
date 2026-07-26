"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// На странице входа глоссарий убран из меню (владелец: "на странице
// входа убери из меню глоссарий") — форма входа должна быть без
// отвлекающих ссылок в сторону.

export function PublicNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const showGlossary = pathname !== "/login";

  return (
    <nav className="flex items-center gap-4 font-technical text-xs uppercase tracking-widest">
      {showGlossary && (
        <Link href="/glossary" className="text-bone hover:text-gold-bright">
          Глоссарий
        </Link>
      )}
      {loggedIn ? (
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
  );
}
