import { prisma } from "@/lib/prisma";
import { scheduleConsultation, markConsultationDone } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Запрошена",
  SCHEDULED: "Назначена",
  COMPLETED: "Проведена",
  CANCELLED: "Отменена",
};

export default async function AdminConsultationsPage() {
  const consultations = await prisma.consultation.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const requested = consultations.filter((c) => c.status === "REQUESTED");
  const rest = consultations.filter((c) => c.status !== "REQUESTED");

  return (
    <main className="p-6">
      <h1 className="font-display text-2xl text-parchment-hi mb-6">Консультации с основателем</h1>

      {requested.length === 0 ? (
        <p className="font-body text-bone-dim mb-8">Новых заявок нет.</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl mb-10">
          {requested.map((c) => (
            <div key={c.id} className="rounded-lg border border-gold bg-void-elevated p-4">
              <p className="font-display text-lg text-gold-bright">{c.user.name}</p>
              <p className="font-technical text-xs text-bone-dim mb-3">
                {c.user.email} · {c.periodMonth} · запрошена {c.createdAt.toLocaleDateString("ru-RU")}
              </p>
              <form action={scheduleConsultation} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex flex-col font-technical text-xs uppercase tracking-widest text-bone-dim">
                  Время звонка
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    className="mt-1 rounded border border-void-border bg-void px-2 py-1 font-body text-sm text-bone"
                  />
                </label>
                <label className="flex flex-col font-technical text-xs uppercase tracking-widest text-bone-dim">
                  Ссылка на звонок
                  <input
                    type="url"
                    name="meetingLink"
                    placeholder="https://..."
                    className="mt-1 rounded border border-void-border bg-void px-2 py-1 font-body text-sm text-bone"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded bg-red-primary px-3 py-1.5 font-technical text-xs uppercase text-parchment hover:bg-red-primary-dark"
                >
                  Назначить
                </button>
              </form>
              <form action={markConsultationDone} className="mt-2">
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  name="decision"
                  value="CANCELLED"
                  className="rounded border border-void-border px-3 py-1.5 font-technical text-xs uppercase text-bone-dim hover:text-red-warning"
                >
                  Отменить
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-3">История</h2>
          <div className="flex flex-col gap-2 max-w-2xl">
            {rest.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded border border-void-border px-4 py-2 font-body text-sm text-bone"
              >
                <span>
                  {c.user.name} · {c.periodMonth}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-bone-dim">{STATUS_LABEL[c.status]}</span>
                  {c.status === "SCHEDULED" && (
                    <form action={markConsultationDone}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        name="decision"
                        value="COMPLETED"
                        className="rounded border border-void-border px-2 py-1 font-technical text-xs uppercase text-bone-dim hover:text-gold-bright"
                      >
                        Отметить проведённой
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
