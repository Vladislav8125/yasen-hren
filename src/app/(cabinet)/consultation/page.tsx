import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUserAccess, effectiveTariff } from "@/lib/access";
import { requestConsultation } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Заявка отправлена — основатель свяжется для назначения времени",
  SCHEDULED: "Назначено",
  COMPLETED: "Проведена",
  CANCELLED: "Отменена",
};

function currentPeriodMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ConsultationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);

  if (!canUserAccess(tariff, "CONSULTATION")) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Консультация с основателем</p>
        <h1 className="font-display text-3xl text-parchment-hi">Доступно с Premium</h1>
        <p className="font-body text-bone-dim max-w-sm">
          Живой звонок с основателем, 1 раз в месяц — часть тарифа Premium.
        </p>
        <Link
          href="/tariffs"
          className="rounded bg-red-primary px-6 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
        >
          Смотреть тарифы
        </Link>
      </div>
    );
  }

  const current = await prisma.consultation.findUnique({
    where: { userId_periodMonth: { userId: user.id, periodMonth: currentPeriodMonth() } },
  });

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-void-border bg-void-elevated p-8 text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold mb-1.5">Premium</p>
        <h1 className="font-display text-3xl text-parchment-hi mb-6">Консультация с основателем</h1>

        {current ? (
          <div className="rounded border border-void-border p-4">
            <p className="font-body text-bone">{STATUS_LABEL[current.status]}</p>
            {current.scheduledAt && (
              <p className="font-technical text-xs text-bone-dim mt-2">
                {current.scheduledAt.toLocaleString("ru-RU")}
              </p>
            )}
            {current.meetingLink && (
              <a
                href={current.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block font-body text-sm text-gold-bright hover:underline"
              >
                Ссылка на звонок
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="font-body text-sm text-bone-dim mb-6">
              1 живой звонок в месяц. Оставь заявку — основатель свяжется, чтобы назначить время.
            </p>
            <form action={requestConsultation}>
              <button
                type="submit"
                className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
              >
                Запросить консультацию
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
