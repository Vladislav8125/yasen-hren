"use client";

import Image from "next/image";
import type { Archetype, CardFamily, LifeSphere, Tariff } from "@/generated/prisma/client";
import { canUserAccess } from "@/lib/access";
import { cardImageSrc } from "@/lib/cardImage";

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

function withScoreBreaks(value: string): string {
  return value.replace(/\s+(?=(?:0\s*[–-]\s*1|2\s*[–-]\s*3)\s*[«"]?\s*да(?=\s|»|$))/giu, "\n");
}

function Field({ label, value, accent }: { label: string; value?: string | null; accent: string }) {
  if (!value) return null;
  return (
    <div className="mb-3 w-full border-b border-current/20 pb-3 last:mb-0 last:border-0 md:mb-2 md:pb-2">
      <p className={`font-technical text-xs uppercase tracking-widest ${accent}`}>{label}</p>
      <p className="whitespace-pre-line font-body text-sm leading-relaxed md:text-base">{withScoreBreaks(value)}</p>
    </div>
  );
}

function PathCell({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded border border-stone-light/30 bg-black/20 p-2">
      <p className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-1">{label}</p>
      <p className="whitespace-pre-line font-body text-sm leading-snug md:text-base">{withScoreBreaks(value)}</p>
    </div>
  );
}

const SPHERE_LABELS: Record<LifeSphere, string> = {
  BUSINESS: "Дело и работа",
  RELATIONS: "Люди и отношения",
  HEALTH: "Здоровье и тело",
  HARMONY: "Внутренний мир",
};

const SPHERE_HEADINGS: Record<LifeSphere, RegExp> = {
  BUSINESS: /(?:^|\n)\s*(?:💼\s*)?(?:Дело и работа|Дело)\s*$/im,
  RELATIONS: /(?:^|\n)\s*(?:🤝|❤️|❤)?\s*(?:Люди и отношения|Отношения)\s*$/im,
  HEALTH: /(?:^|\n)\s*(?:🌿|🫀)?\s*(?:Здоровье и тело|Тело)\s*$/im,
  HARMONY: /(?:^|\n)\s*(?:🧠|🧭)?\s*(?:Внутренний мир|Баланс)\s*$/im,
};

function beforeSpheres(value: string): string {
  const marker = value.search(/(?:^|\n)\s*КАРТА ПО ЧЕТЫРЁМ СФЕРАМ\s*$/im);
  return marker >= 0 ? value.slice(0, marker).trim() : value.trim();
}

function sphereDescription(value: string, sphere: LifeSphere): string {
  const startMatch = SPHERE_HEADINGS[sphere].exec(value);
  if (!startMatch || startMatch.index === undefined) return "";
  const start = startMatch.index + (startMatch[0].startsWith("\n") ? 1 : 0);
  const nextIndexes = (Object.keys(SPHERE_HEADINGS) as LifeSphere[])
    .filter((candidate) => candidate !== sphere)
    .map((candidate) => SPHERE_HEADINGS[candidate].exec(value)?.index ?? -1)
    .filter((index) => index > start);
  const transition = value.search(/(?:^|\n)\s*(?:КУДА ДАЛЬШЕ|СВЯЗЬ С АРХЕТИПАМИ)\b/im);
  const endCandidates = [...nextIndexes, transition >= 0 ? transition : value.length].filter((index) => index > start);
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : value.length;
  return value.slice(start, end).trim();
}

function isChapterHeading(line: string): boolean {
  const normalized = line.trim();
  if (!normalized || normalized.length > 90) return false;
  const letters = normalized.replace(/[^\p{L}]/gu, "");
  if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
  return /^(?:почему такое имя|где ты сейчас|что это значит|обратная сторона|тень(?::|\s)|ритуал(?:\s|$)|проверь себя|куда дальше|связь с архетипами)/i.test(normalized);
}

function splitChapters(value: string): Array<{ title: string; body: string }> {
  const chapters: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } = { title: "Введение", lines: [] };
  for (const line of value.replace(/\r\n/g, "\n").split("\n")) {
    if (isChapterHeading(line)) {
      if (current.lines.some((item) => item.trim())) chapters.push(current);
      current = { title: line.trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.some((item) => item.trim())) chapters.push(current);
  return chapters.map((chapter) => ({ title: chapter.title, body: chapter.lines.join("\n").trim() })).filter((chapter) => chapter.body);
}

function RichText({ text }: { text: string }) {
  const blocks: Array<{ type: "paragraph" | "list"; content: string[] }> = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", content: [paragraph.join(" ")] });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", content: [...list] });
      list = [];
    }
  };
  for (const rawLine of withScoreBreaks(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (/^(?:0\s*[–-]\s*1|2\s*[–-]\s*3)\s*[«"]?\s*да(?=\s|»|$)/i.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "paragraph", content: [line] });
    } else if (/^(?:•|-|—)\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^(?:•|-|—)\s+/, ""));
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => block.type === "list" ? (
        <ul key={index} className="list-disc space-y-1 pl-5 font-body text-sm leading-relaxed md:text-base">
          {block.content.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
        </ul>
      ) : (
        <p key={index} className="font-body text-sm leading-relaxed md:text-base">{block.content[0]}</p>
      ))}
    </div>
  );
}

function ChapterAccordion({ text }: { text: string }) {
  const chapters = splitChapters(text);
  const iconFor = (title: string) => {
    const value = title.toLowerCase();
    if (value.includes("почему тебе выпала")) return "🧭";
    if (value.includes("почему такое имя")) return "🏷️";
    if (value.includes("где ты сейчас")) return "👁️";
    if (value.includes("что это значит")) return "💡";
    if (value.includes("обратная сторона")) return "↔️";
    if (value.includes("проверь себя")) return "✅";
    if (value.includes("ритуал")) return "🕯️";
    if (value.includes("куда дальше")) return "➡️";
    if (value.includes("связь с архетипами")) return "🔗";
    return "🃏";
  };
  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => (
        <details key={`${chapter.title}-${index}`} open={index === 0} className="rounded-lg border border-parchment-border/70 bg-white/70">
          <summary className="cursor-pointer list-none px-4 py-3 font-technical text-sm font-bold uppercase tracking-widest text-red-primary marker:hidden">
            <span aria-hidden="true" className="mr-2">{iconFor(chapter.title)}</span>{chapter.title}
          </summary>
          <div className="border-t border-parchment-border/50 px-4 py-4 text-ink">
            <RichText text={chapter.body} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function ArchetypeCard({ archetype, tariff, revealed: forcedRevealed, onReveal, selectedSphere }: { archetype: Archetype; tariff: Tariff; revealed?: boolean; onReveal?: () => void; selectedSphere?: LifeSphere | null }) {
  const style = FAMILY_STYLES[archetype.family];
  const textColor = TEXT_ON[archetype.family];
  const hasRedFlag = archetype.family === "SHADOW" || archetype.family === "LIMINAL";
  const hasExtended = canUserAccess(tariff, "EXTENDED_CARD_CONTENT");
  const revealed = forcedRevealed ?? Boolean(onReveal);
  const coreDescription = archetype.extendedDescription ? beforeSpheres(archetype.extendedDescription) : "";
  const selectedSphereText = selectedSphere
    ? (archetype.extendedDescription ? sphereDescription(archetype.extendedDescription, selectedSphere) : "") ||
      [
        "Эта карта раскрывается в выбранной сфере через следующие вопросы:",
        archetype.essence,
        archetype.function,
        archetype.inLife,
        archetype.cardQuestion,
      ].filter(Boolean).join("\n\n")
    : "";

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

      {archetype.clinicalFlag && (
        <div className="mt-3 rounded border border-red-warning bg-red-primary-dark/20 p-3">
          {hasRedFlag && <p className="mb-1 font-technical text-xs uppercase tracking-widest text-red-warning">⚠ Красный флаг</p>}
          <p className="font-body text-xs text-red-warning">{archetype.clinicalFlag}</p>
        </div>
      )}
    </>
  );

  const hasDescription = Boolean(coreDescription || archetype.usageInstruction || selectedSphereText);

  return (
    <>
    <article className={`w-full max-w-sm ${style.bg} shadow-md ${textColor} p-5 md:max-w-5xl md:p-6`}>
      {/* Десктоп: изображение слева, короткое описание справа */}
      <div className="hidden items-start gap-6 md:flex md:flex-row">
        {archetype.imageUrl && (
          <div className="relative aspect-[20/41] w-1/3 max-w-xs shrink-0 overflow-hidden rounded">
            <Image src={cardImageSrc(archetype.imageUrl)} alt={archetype.name} fill sizes="(max-width: 768px) 92vw, 460px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {info}
        </div>
      </div>

      {/* Мобильный экран: изображение сверху, затем короткое описание */}
      <div className="md:hidden">
        {archetype.imageUrl && (
          <div className="relative mb-4 aspect-[20/41] w-full overflow-hidden rounded">
            <Image src={cardImageSrc(archetype.imageUrl)} alt={archetype.name} fill sizes="(max-width: 768px) 92vw, 460px" className="object-cover" />
          </div>
        )}
        {info}
      </div>
    </article>

    {hasExtended && hasDescription && revealed && (
      <section className="w-full max-w-sm rounded-xl border-2 border-gold/60 bg-void-elevated p-5 text-ink shadow-md md:max-w-5xl md:p-6">
        <p className="mb-4 font-technical text-xs uppercase tracking-widest text-red-primary">Расширенное описание</p>
        {selectedSphere && selectedSphereText ? (
          <div>
            <p className="mb-1 font-technical text-xs uppercase tracking-widest text-red-primary">Сфера: {SPHERE_LABELS[selectedSphere]}</p>
            <ChapterAccordion text={selectedSphereText} />
          </div>
        ) : coreDescription ? (
          <div className="mb-4">
            <ChapterAccordion text={coreDescription} />
          </div>
        ) : null}
        {!selectedSphere && archetype.usageInstruction && (
          <div>
            <p className="mb-1 font-technical text-xs uppercase tracking-widest text-red-primary">Инструкция как пользоваться</p>
            <ChapterAccordion text={archetype.usageInstruction} />
          </div>
        )}
      </section>
    )}

    {!hasExtended && hasDescription && (
      <div className="w-full max-w-sm rounded-xl border border-dashed border-gold/60 bg-void-elevated p-4 text-center shadow-md md:max-w-5xl">
        <p className="font-technical text-xs uppercase tracking-widest text-red-primary">Развёрнутое описание — с тарифом «Стандарт»</p>
      </div>
    )}
    </>
  );
}
