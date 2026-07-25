import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { askAssistant } from "@/lib/rag";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q } = await searchParams;
  const answer = q?.trim() ? await askAssistant(q.trim()) : null;

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Спроси</p>
        <h1 className="font-display text-3xl text-parchment-hi">Ясен Хрен — ассистент</h1>
      </div>

      <form method="GET" className="flex w-full max-w-lg gap-2">
        <input
          name="q"
          defaultValue={q}
          required
          placeholder="Что такое Бабай? Почему мне попадаются тени?"
          className="flex-1 rounded border border-void-border bg-void px-3 py-2 font-body text-bone outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="rounded bg-red-primary px-5 py-2 font-technical text-xs uppercase tracking-widest text-parchment-hi hover:bg-red-primary-dark"
        >
          Спросить
        </button>
      </form>

      {answer && (
        <div className="w-full max-w-lg">
          {answer.mode === "literal" && (
            <div className="rounded-lg border-2 border-gold bg-void-elevated p-5">
              <p className="font-technical text-xs uppercase tracking-widest text-gold mb-2">
                Дословно · {answer.source}
              </p>
              <p className="font-body text-bone whitespace-pre-line">{answer.text}</p>
            </div>
          )}
          {answer.mode === "rag" && (
            <div className="rounded-lg border border-void-border bg-void-elevated p-5">
              <p className="font-body text-bone whitespace-pre-line">{answer.text}</p>
              {answer.sources && answer.sources.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-technical text-xs uppercase tracking-widest text-bone-dim">
                    Источники
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {answer.sources.map((s, i) => (
                      <li key={i} className="font-technical text-xs text-bone-dim">
                        {s}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {answer.mode === "unavailable" && (
            <div className="rounded-lg border border-dashed border-bone-dim p-5">
              <p className="font-body text-sm text-bone-dim">{answer.text}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
