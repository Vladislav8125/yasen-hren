import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setUserTariff } from "./actions";

const TARIFFS = ["FREE", "STANDARD", "PREMIUM"] as const;

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (me.role !== "ADMIN") redirect("/today");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="p-6">
      <h1 className="font-display text-2xl text-parchment-hi mb-6">Пользователи</h1>
      <div className="overflow-x-auto">
        <table className="w-full font-body text-sm text-bone">
          <thead>
            <tr className="border-b border-void-border text-left font-technical text-xs uppercase tracking-widest text-bone-dim">
              <th className="py-2 pr-4">Имя</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Роль</th>
              <th className="py-2 pr-4">Тариф</th>
              <th className="py-2 pr-4">Сменить тариф</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-void-border/50">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.role}</td>
                <td className="py-2 pr-4 text-gold-bright">{u.tariff}</td>
                <td className="py-2 pr-4">
                  <form action={setUserTariff} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="tariff"
                      defaultValue={u.tariff}
                      className="rounded border border-void-border bg-void px-2 py-1 text-xs"
                    >
                      {TARIFFS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-red-primary px-3 py-1 font-technical text-xs uppercase text-parchment-hi hover:bg-red-primary-dark"
                    >
                      Применить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
