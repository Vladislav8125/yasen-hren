"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Archetype, Tariff } from "@/generated/prisma/client";
import { ArchetypeCard } from "./ArchetypeCard";
import { drawSecondCard } from "@/app/(cabinet)/today/actions";

const SPHERES = [
  { value: "BUSINESS", label: "Бизнес / Работа", dot: "bg-sphere-business" },
  { value: "HEALTH", label: "Здоровье", dot: "bg-sphere-health" },
  { value: "RELATIONS", label: "Отношения", dot: "bg-sphere-relations" },
  { value: "HARMONY", label: "Баланс", dot: "bg-sphere-harmony" },
];

export function CardDialog({
  archetype,
  tariff,
  isSecondary,
  secondArchetype,
}: {
  archetype: Archetype;
  tariff: Tariff;
  isSecondary?: boolean;
  secondArchetype?: Archetype | null;
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [sphereOpen, setSphereOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-56 cursor-pointer flex-col items-center gap-2"
      >
        {archetype.imageUrl ? (
          <div className="relative aspect-[20/41] w-full overflow-hidden rounded-lg shadow-md transition-transform group-hover:scale-[1.03]">
            <Image src={archetype.imageUrl} alt={archetype.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[20/41] w-full items-center justify-center rounded-lg shadow-md bg-void-elevated p-3 text-center">
            <span className="font-display text-lg text-parchment-hi">{archetype.name}</span>
          </div>
        )}
        <p className="font-display text-base text-parchment-hi">{archetype.name}</p>
      </button>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-y-auto bg-void p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) setOpen(false);
      }}
    >
      <div className="flex w-full max-w-sm md:max-w-3xl flex-col items-center gap-4 py-8">
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
            className="rounded-full border border-void-border bg-white px-3 py-1 font-technical text-xs uppercase tracking-widest text-bone-dim hover:border-red-warning hover:text-red-warning"
          >
            Закрыть
          </button>
        </div>

        <ArchetypeCard archetype={archetype} tariff={tariff} revealed={revealed} onReveal={() => setRevealed(true)} />

        <div className="flex w-full flex-col gap-2.5">
          {/* Подробное описание */}
          {!revealed && archetype.extendedDescription && (
            tariff === "FREE" ? (
              <div className="flex flex-col gap-1.5 rounded-lg border border-gold/40 bg-gold/5 p-4 text-center">
                <p className="font-body text-sm text-bone">
                  Развёрнутое описание и практика доступны на платном тарифе
                </p>
                <Link
                  href="/tariffs"
                  className="rounded-lg bg-gold-bright px-4 py-2.5 font-technical text-xs font-semibold uppercase tracking-wider text-parchment-hi hover:bg-gold transition-colors"
                >
                  Смотреть тарифы
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="w-full rounded-lg border-2 border-gold bg-gold/10 py-3 font-technical text-xs uppercase tracking-widest text-gold-bright hover:bg-gold/20 hover:text-parchment-hi transition-colors"
              >
                Подробное описание
              </button>
            )
          )}

          {/* Вторая карта */}
          {!isSecondary && (
            secondArchetype ? (
              <div className="flex flex-col gap-1.5 rounded-lg border border-gold/40 bg-gold/5 p-4 text-center">
                <p className="font-body text-sm text-bone">Вторая карта уже на странице — открой её рядом</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gold py-2.5 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10"
                >
                  Закрыть и посмотреть
                </button>
              </div>
            ) : (
              tariff === "PREMIUM" ? (
                !sphereOpen ? (
                  <button
                    type="button"
                    onClick={() => setSphereOpen(true)}
                    className="w-full rounded-lg bg-red-primary py-3 font-technical text-xs font-semibold uppercase tracking-widest text-parchment shadow-md hover:bg-red-primary-dark transition-colors"
                  >
                    Вторая карта
                  </button>
                ) : (
                  <form action={drawSecondCard} className="flex flex-col gap-3 rounded-lg border-2 border-gold bg-gold/5 p-5">
                    <p className="font-display text-lg text-parchment-hi text-center">
                      Выбери сферу жизни
                    </p>
                    <p className="font-body text-xs text-bone-dim text-center -mt-2">
                      Вторая карта откроется с развёрнутым описанием
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {SPHERES.map((s) => (
                        <label
                          key={s.value}
                          className="flex items-center gap-2 rounded-xl border-2 border-void-border bg-white px-4 py-3 has-checked:border-gold-bright has-checked:bg-gold/10 has-checked:shadow-md cursor-pointer transition-all hover:border-gold/50"
                        >
                          <input type="radio" name="choice" value={s.value} className="accent-gold h-4 w-4" />
                          <span className={`h-3 w-3 rounded-full ${s.dot} shadow-sm`} />
                          <span className="font-technical text-xs uppercase tracking-wider text-bone">{s.label}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 rounded-xl border-2 border-void-border bg-white px-4 py-3 has-checked:border-gold-bright has-checked:bg-gold/10 has-checked:shadow-md cursor-pointer transition-all hover:border-gold/50">
                        <input type="radio" name="choice" value="RANDOM" className="accent-gold h-4 w-4" />
                        <span className="h-3 w-3 rounded-full bg-bone-dim shadow-sm" />
                        <span className="font-technical text-xs uppercase tracking-wider text-bone">Случайная</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-red-primary py-3 font-technical text-xs font-semibold uppercase tracking-widest text-parchment shadow-md hover:bg-red-primary-dark transition-colors"
                    >
                      Открыть вторую карту
                    </button>
                  </form>
                )
              ) : (
                <div className="flex flex-col gap-1.5 rounded-lg border border-gold/40 bg-gold/5 p-4 text-center">
                  <p className="font-body text-sm text-bone">
                    Вторая карта раскрывает ситуацию с новой стороны
                  </p>
                  <Link
                    href="/tariffs"
                    className="rounded-lg bg-gold-bright px-4 py-2.5 font-technical text-xs font-semibold uppercase tracking-wider text-parchment-hi hover:bg-gold transition-colors"
                  >
                    Смотреть тарифы
                  </Link>
                </div>
              )
            )
          )}

          {/* Консультация */}
          <Link
            href="/shop/consultation"
            className="w-full rounded-lg border-2 border-gold/40 py-3 text-center font-technical text-xs uppercase tracking-widest text-gold hover:border-gold hover:bg-gold/5 transition-all"
          >
            Консультация с Мастером
          </Link>

          {/* Повысить тариф */}
          {tariff === "FREE" && (
            <Link
              href="/tariffs"
              className="w-full rounded-lg bg-red-primary py-3 text-center font-technical text-xs font-semibold uppercase tracking-widest text-parchment shadow-md hover:bg-red-primary-dark transition-colors"
            >
              Повысить тариф
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
