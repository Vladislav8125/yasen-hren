import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bookPsychologist } from "../actions";

export default async function ShopConsultationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const existing = await prisma.shopOrder.findFirst({
    where: { userId: session.user.id, product: "CONSULTATION", status: { not: "CANCELLED" } },
    include: { psychologist: true },
  });

  const psychologists = await prisma.psychologist.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-6">
      <div className="text-center">
        <Link href="/shop" className="font-technical text-xs uppercase tracking-widest text-gold hover:text-gold-bright">
          ← Магазин
        </Link>
        <h1 className="font-display text-3xl text-parchment-hi mt-2">Выберите психолога</h1>
      </div>

      {existing ? (
        <div className="w-full max-w-md rounded-lg border border-void-border bg-void-elevated p-6 text-center">
          <p className="font-body text-bone">
            Вы записаны. Специалист: <span className="text-gold-bright">{existing.psychologist?.name}</span>
          </p>
          <p className="font-technical text-xs uppercase tracking-widest text-bone-dim mt-2">
            Заявка отправлена — свяжемся с вами
          </p>
        </div>
      ) : (
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {psychologists.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-center rounded-lg border border-void-border bg-void-elevated p-6 text-center"
            >
              <div className="mb-4 h-24 w-24 rounded-full border border-gold bg-parchment" aria-hidden />
              <h2 className="font-display text-xl text-parchment-hi mb-1">{p.name}</h2>
              <p className="font-body text-sm text-bone-dim mb-4">{p.credentials}</p>
              <form action={bookPsychologist} className="w-full">
                <input type="hidden" name="psychologistId" value={p.id} />
                <button
                  type="submit"
                  className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                >
                  Записаться
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
