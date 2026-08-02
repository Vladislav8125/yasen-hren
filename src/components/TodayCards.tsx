"use client";

import type { Archetype, Tariff } from "@/generated/prisma/client";
import { CardDialog } from "@/components/CardDialog";

export function TodayCards({
  primary,
  secondary,
  pathCard,
  tariff,
}: {
  primary: Archetype;
  secondary: Archetype | null;
  pathCard: Archetype | null;
  tariff: Tariff;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      <CardDialog archetype={primary} tariff={tariff} secondArchetype={secondary} />
      {secondary && (
        <CardDialog archetype={secondary} tariff={tariff} isSecondary />
      )}
      {pathCard && (
        <div className="flex flex-col items-center gap-2">
          <p className="font-technical text-xs uppercase tracking-widest text-gold-bright">Карта Путника</p>
          <CardDialog archetype={pathCard} tariff={tariff} isSecondary />
        </div>
      )}
    </div>
  );
}
