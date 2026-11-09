import { Suspense } from "react";
import { PublicShopCheckout } from "@/components/PublicShopCheckout";

type ShopCheckoutPageProps = {
  searchParams: Promise<{
    product?: string;
    variant?: string;
    source?: string;
  }>;
};

export default async function ShopCheckoutPage({
  searchParams,
}: ShopCheckoutPageProps) {
  const params = await searchParams;
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl p-12 font-body text-bone-dim">
          Загрузка оформления заказа…
        </main>
      }
    >
      <PublicShopCheckout
        productParam={params.product ?? ""}
        variantParam={params.variant}
        sourceParam={params.source ?? ""}
      />
    </Suspense>
  );
}
