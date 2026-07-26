import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { CabinetNav } from "@/components/CabinetNav";

// Личный кабинет — Фаза C редизайна (plans/2026-07-26-yasen-hren-redesign-light-cabinet.md):
// левый сайдбар вместо верхнего меню, по образцу референса GRO (лого сверху,
// пункты иконка+подпись, активный подсвечен, "Выйти" отдельно внизу).
// На мобильном сайдбар становится горизонтальной прокручиваемой полосой сверху.

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-void-border bg-void-elevated p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-r md:border-b-0 md:p-6">
        <Link href="/" className="hidden font-display text-lg text-parchment-hi md:block">
          ЯСЕН ХРЕН
        </Link>
        <CabinetNav />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="md:mt-auto"
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-technical text-xs uppercase tracking-widest text-bone-dim hover:text-red-warning"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M8 17H4a1 1 0 01-1-1V4a1 1 0 011-1h4" />
              <path d="M13 14l4-4-4-4M17 10H7" />
            </svg>
            Выйти
          </button>
        </form>
      </aside>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
