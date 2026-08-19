import { Suspense } from "react";
import { PublicShopCheckout } from "@/components/PublicShopCheckout";

export default function ShopCheckoutPage() {
  return <Suspense fallback={<main className="mx-auto max-w-2xl p-12 font-body text-bone-dim">Загрузка оформления заказа…</main>}><PublicShopCheckout /></Suspense>;
}
