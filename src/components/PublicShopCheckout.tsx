"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PUBLIC_SHOP_PRODUCTS, rub } from "@/lib/public-shop";

export function PublicShopCheckout() {
  const params = useSearchParams();
  const product = useMemo(() => PUBLIC_SHOP_PRODUCTS.find((item) => item.id === params.get("product")), [params]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  if (!product) return <main className="mx-auto w-full max-w-2xl px-6 py-20"><h1 className="font-display text-3xl text-parchment-hi">Товар не найден</h1><Link href="/shop" className="mt-5 inline-block text-gold">Вернуться в магазин</Link></main>;
  const productId = product.id;
  if (orderId) return <main className="mx-auto w-full max-w-2xl px-6 py-20"><p className="font-technical text-xs uppercase tracking-widest text-gold">Заказ принят</p><h1 className="mt-3 font-display text-4xl text-parchment-hi">Спасибо, мы получили заказ</h1><p className="mt-5 font-body leading-relaxed text-bone-dim">Номер заказа: <span className="text-bone">{orderId}</span>. Онлайн-оплата появится здесь сразу после подключения Робокассы. Мы также свяжемся с вами по указанным контактам.</p><Link href="/shop" className="mt-7 inline-block rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment">Вернуться в магазин</Link></main>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/public-shop/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), quantity: form.get("quantity"), deliveryAddress: form.get("deliveryAddress"), comment: form.get("comment"), promoCode: form.get("promoCode") }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) setError(result.error ?? "Не удалось оформить заказ"); else setOrderId(result.orderId);
  }

  return <main className="mx-auto w-full max-w-2xl px-6 py-14 md:py-20"><Link href="/shop" className="font-technical text-xs uppercase tracking-widest text-gold">← В магазин</Link><p className="mt-10 font-technical text-xs uppercase tracking-widest text-gold">Оформление заказа</p><h1 className="mt-3 font-display text-4xl text-parchment-hi">{product.title}</h1><p className="mt-2 font-body text-bone-dim">{product.format} · <span className="text-red-primary">{rub(product.priceRub)}</span></p><form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-void-border bg-void-elevated p-6 md:p-8"><label className="font-body text-sm text-bone">Имя<input required name="name" autoComplete="name" className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label><label className="font-body text-sm text-bone">Email<input required name="email" type="email" autoComplete="email" className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label><label className="font-body text-sm text-bone">Телефон<input required name="phone" type="tel" autoComplete="tel" className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label>{product.requiresDelivery && <label className="font-body text-sm text-bone">Адрес доставки<textarea required name="deliveryAddress" className="mt-1 min-h-20 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label>}<label className="font-body text-sm text-bone">Количество<input name="quantity" type="number" min="1" max="10" defaultValue="1" className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label><label className="font-body text-sm text-bone">Промокод<input name="promoCode" className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label><label className="font-body text-sm text-bone">Комментарий<textarea name="comment" className="mt-1 min-h-20 w-full rounded border border-void-border bg-void px-3 py-2 text-bone" /></label><label className="flex gap-3 font-body text-xs leading-relaxed text-bone-dim"><input required type="checkbox" className="mt-1" /><span>Я принимаю условия <Link href="/policies/offer" className="text-gold">публичной оферты</Link> и <Link href="/policies/privacy" className="text-gold">политики конфиденциальности</Link>.</span></label>{error && <p className="font-body text-sm text-red-warning">{error}</p>}<button disabled={loading} className="rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment disabled:opacity-50">{loading ? "Создаём заказ…" : "Подтвердить заказ"}</button></form></main>;
}
