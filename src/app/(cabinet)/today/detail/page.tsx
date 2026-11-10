import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import { effectiveTariff } from "@/lib/access";
import { CardDetailV2 } from "@/components/CardDetailV2";

export default async function CardDetailPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [user, params] = await Promise.all([prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }), searchParams]);
  const draw = await getOrCreateDailyDraw({ userId: user.id, channel: "WEB", wantsSecondary: false });
  const isSecondary = params.card === "second" && Boolean(draw.secondaryArchetype);
  return <CardDetailV2 card={isSecondary ? draw.secondaryArchetype! : draw.primaryArchetype} tariff={effectiveTariff(user)} secondary={isSecondary} hasSecondary={Boolean(draw.secondaryArchetype)} sphere={isSecondary ? draw.sphereRequested : null} />;
}
