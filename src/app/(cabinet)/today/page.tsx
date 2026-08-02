import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDailyDraw } from "@/lib/cardEngine";
import { effectiveTariff } from "@/lib/access";
import { TodayCards } from "@/components/TodayCards";
import { CardDialog } from "@/components/CardDialog";

function todayLabel() {
  return new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);

  const draw = await getOrCreateDailyDraw({
    userId: user.id,
    channel: "WEB",
    wantsSecondary: false,
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-6">
      <p className="font-technical text-xs uppercase tracking-widest text-gold">{todayLabel()}</p>
      <p className="font-display text-2xl text-parchment-hi -mt-4">Карта дня</p>
      <p className="font-body text-base text-bone-dim -mt-6">Нажмите на карту, чтобы открыть</p>
      <div className="flex flex-wrap justify-center gap-8">
        <TodayCards
          primary={draw.primaryArchetype}
          secondary={draw.secondaryArchetype}
          pathCard={draw.pathArchetype}
          tariff={tariff}
        />
      </div>
    </div>
  );
}
