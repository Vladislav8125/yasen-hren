"use client";

import { useState } from "react";
import Image from "next/image";
import type { Archetype, CardFamily, Tariff } from "@/generated/prisma/client";
import { canUserAccess } from "@/lib/access";

const FAMILY_STYLES: Record<CardFamily, { bg: string; border: string; accent: string }> = {
  LIGHT: { bg: "bg-parchment", border: "border-gold", accent: "text-red-primary" },
  SHADOW: { bg: "bg-void-elevated", border: "border-void-border", accent: "text-red-warning" },
  LIMINAL: { bg: "bg-void-elevated", border: "border-teal", accent: "text-teal" },
  PATH: { bg: "bg-stone-dark", border: "border-stone-light", accent: "text-gold-bright" },
};

const TEXT_ON: Record<CardFamily, string> = {
  LIGHT: "text-ink",
  SHADOW: "text-bone",
  LIMINAL: "text-bone",
  PATH: "text-stone-light",
};

function Field({ label, value, accent }: { label: string; value?: string | null; accent: string }) {
  if (!value) return null;
  return (
    <div className="mb-2 md:mb-1.5">
      <p className={`font-technical text-xs uppercase tracking-widest ${accent}`}>{label}</p>
      <p className="font-body text-xs md:text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function PathCell({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded border border-stone-light/30 bg-black/20 p-2">
      <p className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-1">{label}</p>
      <p className="font-body text-xs md:text-sm leading-snug">{value}</p>
    </div>
  );
}

export function ArchetypeCard({ archetype, tariff, revealed: forcedRevealed, onReveal }: { archetype: Archetype; tariff: Tariff; revealed?: boolean; onReveal?: () => void }) {
  const style = FAMILY_STYLES[archetype.family];
  const textColor = TEXT_ON[archetype.family];
  const hasExtended = canUserAccess(tariff, "EXTENDED_CARD_CONTENT");
  const [internalRevealed, setInternalRevealed] = useState(false);
  const revealed = forcedRevealed ?? internalRevealed;
  const setRevealed = onReveal ?? ((_: boolean) => setInternalRevealed(true));

  const info = (
    <>
      <h2 className={`font-display text-2xl md:text-3xl text-center md:text-left mb-1 ${style.accent}`}>{archetype.name}</h2>
      <p className="font-body italic text-center md:text-left text-sm opacity-80 mb-4">&laquo;{archetype.tagline}&raquo;</p>

      <Field label="Свойство" value={archetype.property} accent={style.accent} />
      <Field label="Архетип" value={archetype.archetypeType} accent={style.accent} />
      <Field label="Суть" value={archetype.essence} accent={style.accent} />
      <Field label="Функция" value={archetype.function} accent={style.accent} />
      <Field label="В жизни" value={archetype.inLife} accent={style.accent} />
      <Field label="Ритуал" value={archetype.ritual} accent={style.accent} />
      <Field label="Тень" value={archetype.shadowSide} accent={style.accent} />
      <Field label="Вопрос карты" value={archetype.cardQuestion} accent={style.accent} />

      {archetype.family === "PATH" && (
        <div className="mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <PathCell label="Функции" value={archetype.pathFunctions} />
          <PathCell label="Ритуалы" value={archetype.pathRituals} />
          <PathCell label="Ресурсы" value={archetype.pathResources} />
          <PathCell label="Тени" value={archetype.pathShadows} />
          <PathCell label="Девиз" value={archetype.pathMotto} />
          <PathCell label="Проявления" value={archetype.pathManifestations} />
        </div>
      )}

      {hasExtended ? (
        (archetype.extendedDescription || archetype.usageInstruction) &&
        (revealed ? (
          <>
            <Field label="Развёрнутое описание" value={archetype.extendedDescription} accent={style.accent} />
            <Field label="Инструкция как пользоваться" value={archetype.usageInstruction} accent={style.accent} />
          </>
        ) : (
          !onReveal && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mb-3 w-full rounded border border-gold py-2 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10 hover:text-gold-bright"
            >
              Показать расширенное описание
            </button>
          )
        ))
      ) : (
        (archetype.extendedDescription || archetype.usageInstruction) && (
          <div className="mb-3 flex items-center gap-2 rounded border border-dashed border-gold/50 p-2">
            <p className="font-technical text-xs uppercase tracking-widest text-gold">Развёрнутое описание — от Standard</p>
          </div>
        )
      )}

      {archetype.clinicalFlag && (
        <div className="mt-3 rounded border border-red-warning bg-red-primary-dark/20 p-3">
          <p className="font-body text-xs text-red-warning">{archetype.clinicalFlag}</p>
        </div>
      )}
    </>
  );

  return (
    <article className={`w-full max-w-sm ${style.bg} shadow-md ${textColor} p-5 md:max-w-3xl md:p-6`}>
      {/* Десктоп: картинка слева, текст справа */}
      <div className="hidden md:flex md:flex-row md:gap-6 md:max-h-[75vh]">
        {archetype.imageUrl && (
          <div className="relative aspect-5/7 w-2/5 shrink-0 overflow-hidden rounded">
            <Image src={archetype.imageUrl} alt={archetype.name} fill className="object-cover" />
          </div>
        )}
        <div className="md:w-3/5 md:overflow-y-auto md:pr-2">
          {info}
        </div>
      </div>

      {/* Мобилка: обычная вертикальная вёрстка */}
      <div className="md:hidden">
        {archetype.imageUrl && (
          <div className="relative mb-4 aspect-5/7 w-full overflow-hidden rounded">
            <Image src={archetype.imageUrl} alt={archetype.name} fill className="object-cover" />
          </div>
        )}
        {info}
      </div>
    </article>
  );
}
