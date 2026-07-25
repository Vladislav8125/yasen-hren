import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Доступ — ADMIN или MODERATOR (глоссарий модерируют оба, тарифы и
// консультации — только ADMIN, проверяется на уровне конкретной страницы).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    redirect("/today");
  }

  return (
    <div className="flex flex-1 flex-col">
      <nav className="flex gap-4 border-b border-void-border bg-void-elevated px-6 py-3 font-technical text-xs uppercase tracking-widest">
        <Link href="/admin/users" className="text-bone hover:text-gold-bright">
          Пользователи
        </Link>
        <Link href="/admin/glossary" className="text-bone hover:text-gold-bright">
          Глоссарий
        </Link>
        <Link href="/admin/consultations" className="text-bone hover:text-gold-bright">
          Консультации
        </Link>
      </nav>
      {children}
    </div>
  );
}
