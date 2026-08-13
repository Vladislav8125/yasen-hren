import { prisma } from "@/lib/prisma";
import { getShopProduct } from "@/lib/shop";
import { updateOrderStatus } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Запрошено",
  CONTACTED: "Связались",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
};

export default async function AdminShopPage() {
  const orders = await prisma.shopOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, psychologist: true },
  });

  const active = orders.filter((o) => o.status === "REQUESTED" || o.status === "CONTACTED");
  const rest = orders.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED");

  return (
    <main className="p-6">
      <h1 className="font-display text-2xl text-parchment-hi mb-6">Заказы магазина</h1>

      {active.length === 0 ? (
        <p className="font-body text-bone-dim mb-8">Активных заказов нет.</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl mb-10">
          {active.map((o) => (
            <div key={o.id} className="rounded-lg border border-gold bg-void-elevated p-4">
              <p className="font-display text-lg text-gold-bright">{getShopProduct(o.product).title}</p>
              <p className="font-technical text-xs text-bone-dim mb-3">
                {o.user.name} · {o.user.email} · {o.createdAt.toLocaleDateString("ru-RU")}
                {o.psychologist && ` · к ${o.psychologist.name}`}
              </p>
              <form action={updateOrderStatus} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={o.id} />
                <label className="flex items-center gap-2 font-technical text-xs text-bone-dim">Оплата, ₽<input name="amountRub" type="number" min="0" step="1" defaultValue={o.amount ? o.amount / 100 : getShopProduct(o.product).priceRub} className="w-28 rounded border border-void-border bg-void px-2 py-1 text-bone" /></label>
                <button
                  type="submit"
                  name="status"
                  value="CONTACTED"
                  className="rounded bg-red-primary px-3 py-1.5 font-technical text-xs uppercase text-parchment hover:bg-red-primary-dark"
                >
                  Связались
                </button>
                <button
                  type="submit"
                  name="status"
                  value="COMPLETED"
                  className="rounded border border-void-border px-3 py-1.5 font-technical text-xs uppercase text-bone-dim hover:text-gold-bright"
                >
                  Выполнено
                </button>
                <button
                  type="submit"
                  name="status"
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
            {rest.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded border border-void-border px-4 py-2 font-body text-sm text-bone"
              >
                <span>
                  {getShopProduct(o.product).title} · {o.user.name}
                </span>
                <span className="text-bone-dim font-technical text-xs uppercase">{STATUS_LABEL[o.status]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
