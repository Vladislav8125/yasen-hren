import { prisma } from "@/lib/prisma";
import { moderateTerm } from "./actions";

export default async function AdminGlossaryPage() {
  const pending = await prisma.glossaryTerm.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: { submittedBy: true },
  });

  return (
    <main className="p-6">
      <h1 className="font-display text-2xl text-parchment-hi mb-6">Глоссарий — на модерации</h1>

      {pending.length === 0 ? (
        <p className="font-body text-bone-dim">Очередь пуста.</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {pending.map((t) => (
            <div key={t.id} className="rounded-lg border border-void-border bg-void-elevated p-4">
              <p className="font-display text-xl text-gold-bright">{t.term}</p>
              <p className="font-body text-sm text-bone mt-1 mb-2">{t.definition}</p>
              <p className="font-technical text-xs text-bone-dim mb-3">
                Предложил: {t.submittedBy.name} · {t.createdAt.toLocaleDateString("ru-RU")}
              </p>
              <form action={moderateTerm} className="flex gap-2">
                <input type="hidden" name="termId" value={t.id} />
                <button
                  type="submit"
                  name="decision"
                  value="approved"
                  className="rounded bg-red-primary px-3 py-1.5 font-technical text-xs uppercase text-parchment hover:bg-red-primary-dark"
                >
                  Одобрить
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="rejected"
                  className="rounded border border-void-border px-3 py-1.5 font-technical text-xs uppercase text-bone-dim hover:text-red-warning"
                >
                  Отклонить
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
