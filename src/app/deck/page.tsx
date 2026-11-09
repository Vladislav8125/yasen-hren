import { PublicShopCheckout } from "@/components/PublicShopCheckout";

type DeckPageProps = {
  searchParams: Promise<{ source?: string }>;
};

export default async function DeckPage({ searchParams }: DeckPageProps) {
  const params = await searchParams;
  return <PublicShopCheckout deckMode sourceParam={params.source ?? ""} />;
}
