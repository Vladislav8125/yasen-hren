import Link from "next/link";
import { auth } from "@/auth";
import { PublicNav } from "@/components/PublicNav";

// Шапка для публичных страниц (вход/регистрация) — не для личного
// кабинета и не для глоссария, у них свой каркас с сайдбаром
// (см. (cabinet)/layout.tsx — глоссарий переехал туда, чтобы не терять
// сайдбар при переходе из кабинета).

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="relative z-40 flex items-center justify-between border-b border-void-border bg-void/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <Link href="/" className="whitespace-nowrap font-display text-base tracking-wide text-parchment-hi sm:text-lg">
          ЯСЕН ХРЕН
        </Link>
        <PublicNav loggedIn={Boolean(session?.user)} />
      </header>
      {children}
    </div>
  );
}
