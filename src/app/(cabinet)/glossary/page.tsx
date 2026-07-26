import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submitTerm } from "./actions";

export default async function GlossaryPage() {
  const session = await auth();
  const terms = await prisma.glossaryTerm.findMany({
    where: { status: "approved" },
    orderBy: { term: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">
          Открытое пространство · доступно на всех тарифах
        </p>
        <h1 className="font-display text-3xl text-parchment-hi">Глоссарий «Ясен Хрен»</h1>
      </div>

      <div className="w-full max-w-2xl">
        {terms.length === 0 ? (
          <p className="text-center font-body text-bone-dim">Пока пусто — станьте первым, кто предложит термин.</p>
        ) : (
          <dl className="space-y-5">
            {terms.map((t) => (
              <div key={t.id} className="border-b border-void-border pb-4">
                <dt className="font-display text-xl text-gold-bright">{t.term}</dt>
                <dd className="font-body text-sm text-bone mt-1">{t.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <section className="w-full max-w-md rounded-lg border border-void-border bg-void-elevated p-6">
        <h2 className="font-display text-xl text-parchment-hi mb-1 text-center">Предложить термин</h2>
        <p className="font-body text-sm text-bone-dim mb-4 text-center">
          Модератор проверит и опубликует, если термин в духе колоды.
        </p>
        {session?.user ? (
          <form action={submitTerm} className="flex flex-col gap-3">
            <input
              name="term"
              required
              placeholder="Термин"
              className="rounded border border-void-border bg-void px-3 py-2 font-body text-bone outline-none focus:border-gold"
            />
            <textarea
              name="definition"
              required
              rows={3}
              placeholder="Определение"
              className="rounded border border-void-border bg-void px-3 py-2 font-body text-bone outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
            >
              Предложить
            </button>
          </form>
        ) : (
          <p className="text-center font-body text-sm text-bone-dim">
            <a href="/login" className="text-gold hover:text-gold-bright">
              Войдите
            </a>
            , чтобы предложить свой термин.
          </p>
        )}
      </section>
    </div>
  );
}
