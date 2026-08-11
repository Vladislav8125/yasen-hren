"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface DailyCard {
  date: Date;
  archetype: { id: string; name: string; imageUrl: string | null };
}

export function DailyCarousel({ cards }: { cards: DailyCard[] }) {
  const [start, setStart] = useState(0);
  const [selected, setSelected] = useState<DailyCard | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const visible = 5;
  const maxStart = Math.max(0, cards.length - visible);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [selected]);

  if (cards.length === 0) {
    return (
      <p className="font-body text-sm text-bone-dim text-center">
        Пока нет карт за последние 7 дней.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStart(Math.max(0, start - 1))}
          disabled={start === 0}
          aria-label="Назад"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold hover:bg-gold/10 disabled:opacity-30"
        >
          &#8592;
        </button>

        <div className="flex gap-4 overflow-hidden">
          {cards.slice(start, start + visible).map((card, i) => (
            <button
              key={start + i}
              type="button"
              onClick={() => setSelected(card)}
              title={`${card.archetype.name} — ${new Date(card.date).toLocaleDateString("ru-RU")}`}
              className="relative h-40 w-20 shrink-0 overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
            >
              {card.archetype.imageUrl ? (
                <Image src={card.archetype.imageUrl} alt={card.archetype.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-parchment p-2 text-center">
                  <span className="font-display text-sm text-parchment-hi">{card.archetype.name}</span>
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                <p className="text-center font-display text-[11px] text-white drop-shadow-md leading-tight">
                  {card.archetype.name}
                </p>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStart(Math.min(maxStart, start + 1))}
          disabled={start >= maxStart}
          aria-label="Вперёд"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold hover:bg-gold/10 disabled:opacity-30"
        >
          &#8594;
        </button>
      </div>

      {/* Всплывающая карта — крупнее, не на весь экран */}
      {selected && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void p-4"
          onClick={(e) => {
            if (e.target === overlayRef.current) setSelected(null);
          }}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Закрыть"
            className="absolute top-4 right-4 rounded-full border border-void-border bg-white px-3 py-1 font-technical text-xs uppercase tracking-widest text-bone-dim hover:border-red-warning hover:text-red-warning"
          >
            Закрыть
          </button>
          <div className="flex w-full max-w-xs flex-col items-center gap-4">
            {selected.archetype.imageUrl ? (
              <div className="relative aspect-[20/41] w-full overflow-hidden rounded-lg shadow-md">
                <Image
                  src={selected.archetype.imageUrl}
                  alt={selected.archetype.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[20/41] w-full items-center justify-center rounded-lg bg-parchment shadow-md p-8">
                <span className="font-display text-4xl text-parchment-hi">{selected.archetype.name}</span>
              </div>
            )}
            <p className="font-display text-2xl text-parchment-hi">{selected.archetype.name}</p>
            <p className="font-body text-sm text-bone-dim">
              {new Date(selected.date).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
