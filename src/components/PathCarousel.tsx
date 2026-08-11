"use client";

import { useState } from "react";
import Image from "next/image";

interface TimelineCard {
  date: Date;
  name: string;
  imageUrl: string | null;
}

export function PathCarousel({ cards }: { cards: TimelineCard[] }) {
  const [start, setStart] = useState(0);
  const visible = 5;
  const maxStart = Math.max(0, cards.length - visible);

  const prev = () => setStart(Math.max(0, start - 1));
  const next = () => setStart(Math.min(maxStart, start + 1));

  const familyDot = "bg-stone-light";

  if (cards.length === 0) {
    return (
      <p className="font-body text-sm text-bone-dim text-center">
        Карты Путника ещё не выпадали — они приходят раз в неделю.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={prev}
        disabled={start === 0}
        aria-label="Назад"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold hover:bg-gold/10 disabled:opacity-30"
      >
        &#8592;
      </button>

      <div className="flex gap-4 overflow-hidden">
        {cards.slice(start, start + visible).map((card, i) => (
          <div
            key={start + i}
            title={`${card.name} — ${new Date(card.date).toLocaleDateString("ru-RU")}`}
            className="relative h-40 w-20 shrink-0 overflow-hidden rounded-lg shadow-md"
          >
            {card.imageUrl ? (
              <Image src={card.imageUrl} alt={card.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-stone-dark p-2 text-center">
                <span className="font-display text-sm text-stone-light">{card.name}</span>
              </div>
            )}
            <span className={`absolute bottom-0 left-0 right-0 h-1.5 ${familyDot}`} />
            <p className="absolute bottom-1.5 left-0 right-0 text-center font-display text-[10px] text-white drop-shadow-lg">
              {card.name}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={next}
        disabled={start >= maxStart}
        aria-label="Вперёд"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold hover:bg-gold/10 disabled:opacity-30"
      >
        &#8594;
      </button>
    </div>
  );
}
