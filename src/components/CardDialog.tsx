"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Archetype, Tariff } from "@/generated/prisma/client";
import { ArchetypeCard } from "./ArchetypeCard";

// Владелец: "карта дня должна появляться одна, при нажатии на карточку
// она приближается, чтобы текст хорошо читался... открывается диалог,
// где всё действие происходит". Тизер — компактное превью, клик
// открывает <dialog> с картой в полный рост.

export function CardDialog({ archetype, tariff }: { archetype: Archetype; tariff: Tariff }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="group flex w-48 cursor-zoom-in flex-col items-center gap-2"
      >
        {archetype.imageUrl ? (
          <div className="relative aspect-5/7 w-full overflow-hidden rounded-lg border-2 border-gold shadow-md transition-transform group-hover:scale-[1.03]">
            <Image src={archetype.imageUrl} alt={archetype.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-5/7 w-full items-center justify-center rounded-lg border-2 border-gold bg-void-elevated p-3 text-center">
            <span className="font-display text-lg text-parchment-hi">{archetype.name}</span>
          </div>
        )}
        <p className="font-display text-base text-parchment-hi">{archetype.name}</p>
      </button>

      <dialog
        ref={dialogRef}
        className="max-h-[90vh] w-[min(90vw,26rem)] rounded-lg bg-transparent p-0 backdrop:bg-ink/70"
      >
        <div className="max-h-[90vh] overflow-y-auto rounded-lg">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Закрыть"
            className="sticky top-2 float-right mr-2 rounded-full bg-void-elevated px-2.5 py-1 font-technical text-sm text-bone-dim hover:text-red-warning"
          >
            ✕
          </button>
          <div className="p-5 pt-2">
            <ArchetypeCard archetype={archetype} tariff={tariff} />
          </div>
        </div>
      </dialog>
    </>
  );
}
