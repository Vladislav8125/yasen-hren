"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PUBLIC_SHOP_PRODUCTS, rub, type PublicShopProduct } from "@/lib/public-shop";

const categories = ["Все", "Карты", "Игры", "Консультации", "Программы", "Мерч"] as const;

export function PublicShopCatalog() {
  const [category, setCategory] = useState<(typeof categories)[number]>("Все");
  const [selected, setSelected] = useState<PublicShopProduct | null>(null);
  const products = useMemo(
    () => category === "Все" ? PUBLIC_SHOP_PRODUCTS : PUBLIC_SHOP_PRODUCTS.filter((product) => product.category === category),
    [category],
  );

  return <>
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14 md:px-10 md:pb-20 md:pt-20">
      <p className="font-technical text-xs uppercase tracking-widest text-gold">Магазин</p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-parchment-hi sm:text-4xl md:text-6xl">Карты, игры и практики, которые остаются с вами</h1>
      <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-bone-dim sm:mt-5 sm:text-lg">Выберите формат для самостоятельной практики, личного разговора или работы с командой.</p>

      <div className="-mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-8 sm:flex-wrap sm:overflow-visible sm:px-0">
        {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2.5 font-technical text-xs uppercase tracking-widest transition ${category === item ? "border-red-primary bg-red-primary text-parchment" : "border-void-border bg-void-elevated text-bone hover:border-gold"}`}>{item}</button>)}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => <article key={product.id} className="group overflow-hidden rounded-2xl border border-void-border bg-void-elevated shadow-[0_6px_22px_rgba(59,42,24,0.10)]">
          <button type="button" onClick={() => setSelected(product)} className="relative block aspect-[4/3] w-full overflow-hidden" aria-label={`Подробнее: ${product.title}`}>
            <Image src={product.image} alt={product.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
          </button>
          <div className="p-5"><p className="font-technical text-[10px] uppercase tracking-widest text-gold">{product.category} · {product.format}</p><h2 className="mt-2 font-display text-2xl text-parchment-hi">{product.title}</h2><p className="mt-3 min-h-12 font-body text-sm leading-relaxed text-bone-dim">{product.shortDescription}</p><div className="mt-5"><span className="font-display text-2xl text-red-primary">{rub(product.priceRub)}</span><div className="mt-3 grid grid-cols-2 gap-2"><Link href={`/shop/checkout?product=${product.id}`} className="rounded bg-red-primary px-2 py-2.5 text-center font-technical text-[10px] uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Заказать</Link><button type="button" onClick={() => setSelected(product)} className="rounded border border-gold px-2 py-2.5 font-technical text-[10px] uppercase tracking-widest text-gold-bright hover:bg-gold/10">Подробнее</button></div></div></div>
        </article>)}
      </div>
    </section>
    {selected && <ProductDialog product={selected} onClose={() => setSelected(null)} />}
  </>;
}

function ProductDialog({ product, onClose }: { product: PublicShopProduct; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={product.title} onMouseDown={onClose}>
    <article className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-void-elevated shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="grid md:grid-cols-2"><div className="relative min-h-72"><Image src={product.image} alt={product.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div><div className="p-6 md:p-8"><div className="flex justify-between gap-4"><p className="font-technical text-[10px] uppercase tracking-widest text-gold">{product.category} · {product.format}</p><button type="button" onClick={onClose} className="font-technical text-xs text-bone-dim hover:text-bone" aria-label="Закрыть">Закрыть ×</button></div><h2 className="mt-3 font-display text-3xl text-parchment-hi">{product.title}</h2><p className="mt-4 font-body leading-relaxed text-bone-dim">{product.description}</p><h3 className="mt-6 font-technical text-[10px] uppercase tracking-widest text-gold">Что входит</h3><ul className="mt-3 space-y-2 font-body text-sm text-bone">{product.includes.map((item) => <li key={item}>— {item}</li>)}</ul><div className="mt-8 flex flex-wrap items-center justify-between gap-4"><span className="font-display text-3xl text-red-primary">{rub(product.priceRub)}</span><Link href={`/shop/checkout?product=${product.id}`} className="rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Заказать</Link></div></div></div>
    </article>
  </div>;
}
