import Image from "next/image";
import type { Archetype, CardFamily, Tariff } from "@/generated/prisma/client";
import { canUserAccess } from "@/lib/access";

// Дизайн-ТЗ, раздел 3.1 — рамка и палитра меняются по семье карты.
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
    <div className="mb-3">
      <p className={`font-technical text-xs uppercase tracking-widest ${accent}`}>{label}</p>
      <p className="font-body text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function PathCell({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded border border-stone-light/30 bg-black/20 p-2.5">
      <p className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-1">{label}</p>
      <p className="font-body text-sm leading-snug">{value}</p>
    </div>
  );
}

export function ArchetypeCard({ archetype, tariff }: { archetype: Archetype; tariff: Tariff }) {
  const style = FAMILY_STYLES[archetype.family];
  const textColor = TEXT_ON[archetype.family];
  const hasExtended = canUserAccess(tariff, "EXTENDED_CARD_CONTENT");

  return (
    <article className={`w-full max-w-sm rounded-lg border-2 ${style.border} ${style.bg} ${textColor} p-5`}>
      {archetype.imageUrl && (
        <div className="relative mb-4 aspect-[5/7] w-full overflow-hidden rounded">
          <Image src={archetype.imageUrl} alt={archetype.name} fill className="object-cover" />
        </div>
      )}

      <h2 className={`font-display text-3xl text-center mb-1 ${style.accent}`}>{archetype.name}</h2>
      <p className="font-body italic text-center text-sm opacity-80 mb-4">«{archetype.tagline}»</p>

      <Field label="Свойство" value={archetype.property} accent={style.accent} />
      <Field label="Архетип" value={archetype.archetypeType} accent={style.accent} />
      <Field label="Суть" value={archetype.essence} accent={style.accent} />
      <Field label="Функция" value={archetype.function} accent={style.accent} />
      <Field label="В жизни" value={archetype.inLife} accent={style.accent} />
      <Field label="Ритуал" value={archetype.ritual} accent={style.accent} />
      <Field label="Тень" value={archetype.shadowSide} accent={style.accent} />
      <Field label="Вопрос карты" value={archetype.cardQuestion} accent={style.accent} />

      {/* Путь Путника (family=PATH) — другая структура печатной карты:
          2-колоночная инфографика вместо полей выше (дизайн-ТЗ, 3.1). */}
      {archetype.family === "PATH" && (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PathCell label="Функции" value={archetype.pathFunctions} />
          <PathCell label="Ритуалы" value={archetype.pathRituals} />
          <PathCell label="Ресурсы" value={archetype.pathResources} />
          <PathCell label="Тени" value={archetype.pathShadows} />
          <PathCell label="Девиз" value={archetype.pathMotto} />
          <PathCell label="Проявления" value={archetype.pathManifestations} />
        </div>
      )}

      {/* Развёрнутое описание / инструкция — Standard+. Единственное место
          в карте за paywall'ом (решение владельца 2026-07-25): контент ещё
          не написан (отдельная контентная задача), поэтому пока это либо
          ничего не показывает (Standard+/пусто), либо лок для Free, когда
          текст появится. */}
      {hasExtended ? (
        <>
          <Field label="Развёрнутое описание" value={archetype.extendedDescription} accent={style.accent} />
          <Field label="Инструкция как пользоваться" value={archetype.usageInstruction} accent={style.accent} />
        </>
      ) : (
        (archetype.extendedDescription || archetype.usageInstruction) && (
          <div className="mb-3 flex items-center gap-2 rounded border border-dashed border-gold/50 p-2">
            <span aria-hidden className="text-gold">🔒</span>
            <p className="font-technical text-xs uppercase tracking-widest text-gold">
              Развёрнутое описание и инструкция — от Standard
            </p>
          </div>
        )
      )}

      {archetype.clinicalFlag && (
        <div className="mt-3 rounded border border-red-warning bg-red-primary-dark/20 p-3">
          <p className="font-body text-xs text-red-warning">⚠ {archetype.clinicalFlag}</p>
        </div>
      )}
    </article>
  );
}
