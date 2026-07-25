import Image from "next/image";
import type { Archetype, CardFamily } from "@/generated/prisma/client";

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

export function ArchetypeCard({ archetype }: { archetype: Archetype }) {
  const style = FAMILY_STYLES[archetype.family];
  const textColor = TEXT_ON[archetype.family];

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
      <Field label="Вопрос карты" value={archetype.cardQuestion} accent={style.accent} />

      {/* Развёрнутое описание / инструкция — Standard+, показываются только
          когда контент реально написан (extendedDescription/usageInstruction
          пока пустые для всей колоды — это отдельная контентная задача,
          архитектурное ТЗ раздел 6). */}
      <Field label="Развёрнутое описание" value={archetype.extendedDescription} accent={style.accent} />
      <Field label="Инструкция как пользоваться" value={archetype.usageInstruction} accent={style.accent} />

      {archetype.clinicalFlag && (
        <div className="mt-3 rounded border border-red-warning bg-red-primary-dark/20 p-3">
          <p className="font-body text-xs text-red-warning">⚠ {archetype.clinicalFlag}</p>
        </div>
      )}
    </article>
  );
}
