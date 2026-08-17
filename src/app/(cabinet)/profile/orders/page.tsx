import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SHOP_PRODUCTS } from "@/lib/shop";
import { orderProduct } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Заявка отправлена — свяжемся с вами",
  CONTACTED: "Мы связались с вами",
  COMPLETED: "Выполнено",
  CANCELLED: "Отменено",
};

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await prisma.shopOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const latestByProduct = new Map(orders.map((o) => [o.product, o]));

  return (
    <div className="flex flex-1 flex-col items-center gap-10 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Магазин</p>
        <h1 className="font-display text-3xl text-parchment-hi">Ясен Хрен — за пределами экрана</h1>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
        {SHOP_PRODUCTS.map((product) => {
          const order = latestByProduct.get(product.id);
          const active = order && order.status !== "CANCELLED";

          return (
            <div
              key={product.id}
              className="flex flex-col rounded-lg border border-void-border bg-void-elevated p-6"
            >
              <h2 className="font-display text-xl text-parchment-hi mb-1">{product.title}</h2>
              <p className="font-body text-sm text-bone-dim mb-4 flex-1">{product.description}</p>
              <p className="mb-4 inline-block w-fit rounded bg-gold/15 px-2.5 py-1 font-technical text-xs uppercase tracking-widest text-gold-bright">
                {product.priceRub.toLocaleString("ru-RU")} ₽
              </p>

              {active ? (
                <p className="rounded border border-void-border p-3 text-center font-technical text-xs uppercase tracking-widest text-bone-dim">
                  {STATUS_LABEL[order.status]}
                </p>
              ) : product.id === "CONSULTATION" ? (
                <Link
                  href="/shop/consultation"
                  className="rounded bg-red-primary py-2.5 text-center font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                >
                  Выбрать Мастера
                </Link>
              ) : (
                <form action={orderProduct}>
                  <input type="hidden" name="product" value={product.id} />
                  <input name="promoCode" placeholder="Промокод партнёра" className="mb-2 w-full rounded border border-void-border bg-void px-3 py-2 text-sm text-bone" />
                  <button
                    type="submit"
                    className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
                  >
                    Заказать
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
