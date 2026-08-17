"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// На странице входа глоссарий убран из меню (владелец: "на странице
// входа убери из меню глоссарий") — форма входа должна быть без
// отвлекающих ссылок в сторону.

export function PublicNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const showGlossary = pathname !== "/login";
  const [open, setOpen] = useState(false);

  const linkClass = "block rounded px-3 py-2 text-bone transition hover:bg-gold/10 hover:text-gold-bright";
  const closeMenu = () => setOpen(false);

  const links = <>
    <Link href="/shop" onClick={closeMenu} className={linkClass}>Магазин</Link>
    {showGlossary && <Link href="/glossary" onClick={closeMenu} className={linkClass}>Глоссарий</Link>}
    <Link href="/partners" onClick={closeMenu} className={linkClass}>Партнёрам</Link>
    {loggedIn ? <Link href="/today" onClick={closeMenu} className="block rounded bg-gold/15 px-3 py-2 text-gold transition hover:bg-gold/25 hover:text-gold-bright">Личный кабинет</Link> : <><Link href="/login" onClick={closeMenu} className={linkClass}>Войти</Link><Link href="/register" onClick={closeMenu} className="block rounded bg-gold/15 px-3 py-2 text-gold transition hover:bg-gold/25 hover:text-gold-bright">Регистрация</Link></>}
  </>;

  return (
    <nav className="relative font-technical text-xs uppercase tracking-widest">
      <div className="hidden items-center gap-1 md:flex">{links}</div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-10 min-w-10 items-center justify-center rounded border border-void-border text-bone hover:border-gold hover:text-gold md:hidden" aria-expanded={open} aria-controls="public-mobile-menu" aria-label={open ? "Закрыть меню" : "Открыть меню"}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d={open ? "M4 4l12 12M16 4 4 16" : "M3 5h14M3 10h14M3 15h14"} /></svg>
      </button>
      {open && <div id="public-mobile-menu" className="absolute right-0 top-12 z-50 flex min-w-56 flex-col gap-1 rounded-lg border border-void-border bg-void-elevated p-2 shadow-xl md:hidden">{links}</div>}
    </nav>
  );
}
