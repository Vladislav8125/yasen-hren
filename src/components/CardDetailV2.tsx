"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Archetype, LifeSphere, Tariff } from "@/generated/prisma/client";
import { cardImageSrc } from "@/lib/cardImage";
import { ShareAppLink } from "@/components/ShareAppLink";

type Tab = "why" | "name" | "where" | "meaning" | "reverse";
type Field = "ally" | "property" | "archetype" | "essence" | "function" | "life" | "ritual" | "question";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "why", label: "Почему тебе выпала эта карта" },
  { id: "name", label: "Почему такое имя" },
  { id: "where", label: "Где ты сейчас" },
  { id: "meaning", label: "Что это значит" },
  { id: "reverse", label: "Обратная сторона" },
];

// Зоны повторяют реальные смысловые полосы стандартной физической карты,
// а не делят изображение на одинаковые случайные прямоугольники.
const HOTSPOTS: Array<{ id: Field; top: string; left: string; width: string; height: string; label: string }> = [
  { id: "ally", top: "47%", left: "8%", width: "84%", height: "3%", label: "Союзник" },
  { id: "property", top: "50.5%", left: "8%", width: "84%", height: "3.2%", label: "Свойство" },
  { id: "archetype", top: "54.5%", left: "8%", width: "84%", height: "3.2%", label: "Архетип" },
  { id: "essence", top: "58.5%", left: "8%", width: "84%", height: "5.8%", label: "Суть" },
  { id: "function", top: "66%", left: "8%", width: "84%", height: "4.5%", label: "Функция" },
  { id: "life", top: "72%", left: "8%", width: "84%", height: "4.5%", label: "В жизни" },
  { id: "ritual", top: "78%", left: "8%", width: "84%", height: "5.5%", label: "Ритуал" },
  { id: "question", top: "85.5%", left: "8%", width: "84%", height: "4.5%", label: "Вопрос карты" },
];

function asBullets(value: string | null) {
  return (value ?? "").split(/\n|(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean).slice(0, 4);
}

const EXTENDED_HEADINGS: Record<Tab, string> = {
  why: "ПОЧЕМУ ТЕБЕ ВЫПАЛА ЭТА КАРТА",
  name: "ПОЧЕМУ ТАКОЕ ИМЯ",
  where: "ГДЕ ТЫ СЕЙЧАС",
  meaning: "ЧТО ЭТО ЗНАЧИТ",
  reverse: "ОБРАТНАЯ СТОРОНА",
};

function extendedSection(description: string | null, tab: Tab) {
  if (!description) return null;
  const lines = description.replace(/\r/g, "").split("\n");
  const headingIndex = lines.findIndex((line) => line.trim().toUpperCase() === EXTENDED_HEADINGS[tab]);
  if (headingIndex < 0) return null;
  const nextTab = TABS[TABS.findIndex((item) => item.id === tab) + 1];
  const nextHeadings = tab === "reverse" ? ["КАРТА ПО ЧЕТЫРЁМ СФЕРАМ", "ТЕНИ РОДА"] : nextTab ? [EXTENDED_HEADINGS[nextTab.id]] : [];
  const endIndex = lines.findIndex((line, index) => index > headingIndex && nextHeadings.some((heading) => heading && line.trim().toUpperCase().startsWith(heading)));
  return lines.slice(headingIndex + 1, endIndex < 0 ? lines.length : endIndex).join("\n").trim() || null;
}

const SPHERE_HEADINGS: Record<LifeSphere, string> = { BUSINESS: "ДЕЛО И РАБОТА", RELATIONS: "ЛЮДИ И ОТНОШЕНИЯ", HEALTH: "ЗДОРОВЬЕ И ТЕЛО", HARMONY: "ВНУТРЕННИЙ МИР" };

function sphereSection(description: string | null, sphere: LifeSphere | null) {
  if (!description || !sphere) return null;
  const lines = description.replace(/\r/g, "").split("\n");
  const headingIndex = lines.findIndex((line) => line.trim().toUpperCase().includes(SPHERE_HEADINGS[sphere]));
  if (headingIndex < 0) return null;
  const endIndex = lines.findIndex((line, index) => index > headingIndex && Object.values(SPHERE_HEADINGS).some((heading) => line.trim().toUpperCase().includes(heading)));
  return lines.slice(headingIndex + 1, endIndex < 0 ? lines.length : endIndex).join("\n").trim() || null;
}

function sphereMeaningSection(description: string | null, sphere: LifeSphere | null) {
  const section = sphereSection(description, sphere);
  if (!section) return null;
  const lines = section.split("\n");
  const stop = lines.findIndex((line) => /^(ПРОВЕРЬ СЕБЯ|ОБРАТНАЯ СТОРОНА\.)/i.test(line.trim()));
  return lines.slice(0, stop < 0 ? lines.length : stop).join("\n").trim() || null;
}

function sphereReverseSection(description: string | null, sphere: LifeSphere | null) {
  const section = sphereSection(description, sphere);
  if (!section) return null;
  const lines = section.split("\n");
  const start = lines.findIndex((line) => /^ОБРАТНАЯ СТОРОНА\./i.test(line.trim()));
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && /^ШАГ\./i.test(line.trim()));
  return lines.slice(start, end < 0 ? lines.length : end).join("\n").trim() || null;
}

function RichDescription({ value }: { value: ReactNode }) {
  if (typeof value !== "string") {
    return <div className="font-body text-base leading-7 text-bone sm:text-lg">{value}</div>;
  }

  const blocks: Array<{ type: "paragraph" | "list" | "heading"; text: string[] }> = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: [paragraph.join(" ")] });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", text: [...list] });
    list = [];
  };

  for (const raw of value.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const letters = line.replace(/[^\p{L}]/gu, "");
    const isHeading = line.length > 2 && line.length < 100 && letters.length > 3 && letters === letters.toUpperCase();
    if (!line) {
      flushParagraph();
      flushList();
    } else if (/^(?:•|\*|-)\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^(?:•|\*|-)\s+/, ""));
    } else if (isHeading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: [line] });
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return <div className="space-y-5 font-body text-base leading-7 text-bone sm:text-lg sm:leading-8">
    {blocks.map((block, index) => block.type === "heading" ? (
      <h3 key={index} className="pt-2 font-technical text-xs font-bold uppercase tracking-[0.15em] text-red-primary sm:text-sm">{block.text[0]}</h3>
    ) : block.type === "list" ? (
      <ul key={index} className="space-y-3 pl-1">
        {block.text.map((item, itemIndex) => <li key={itemIndex} className="flex gap-3"><span aria-hidden="true" className="mt-[0.72rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /><span>{item}</span></li>)}
      </ul>
    ) : (
      <p key={index}>{block.text[0]}</p>
    ))}
  </div>;
}

function PrintedText({ card, active, onActivate }: { card: Archetype; active: Field | null; onActivate: (field: Field) => void }) {
  const rows: Array<{ label: string; value: string | null; field: Field }> = [
    { label: "Союзник", value: card.lightAllyName, field: "ally" },
    { label: "Свойство", value: card.property, field: "property" },
    { label: "Архетип", value: card.archetypeType, field: "archetype" },
    { label: "Суть", value: card.essence, field: "essence" },
    { label: "Функция", value: card.function, field: "function" },
    { label: "В жизни", value: card.inLife, field: "life" },
    { label: "Ритуал", value: card.ritual, field: "ritual" },
    { label: "Вопрос карты", value: card.cardQuestion, field: "question" },
  ].filter((row): row is { label: string; value: string; field: Field } => Boolean(row.value));

  return <section className="mt-8 rounded-2xl border border-void-border bg-void-elevated/95 p-5 shadow-[0_12px_36px_-28px_rgba(42,27,19,.7)] sm:p-7">
    <div className="divide-y divide-void-border border-y border-void-border">
      {rows.map((row) => <div key={row.label} onMouseEnter={() => onActivate(row.field)} className={`-mx-3 px-3 py-4 transition-colors sm:-mx-4 sm:px-4 ${row.field === active ? "bg-gold/10 shadow-[inset_2px_0_0_rgba(212,175,55,.9)]" : ""}`}>
        <p className="font-technical text-xs font-bold uppercase tracking-[0.16em] text-red-primary">{row.label}</p>
        <p className="mt-1 whitespace-pre-line font-body leading-relaxed text-bone">{row.value}</p>
      </div>)}
    </div>
  </section>;
}

function CardSurface({ card, active, onActivate }: { card: Archetype; active: Field | null; onActivate: (field: Field) => void }) {
  return <div className="relative mx-auto mt-7 w-full max-w-sm">
    <div className="relative aspect-[20/41] overflow-hidden rounded-[1.35rem] border border-gold/50 bg-void-elevated shadow-xl">
      {card.imageUrl && <Image src={cardImageSrc(card.imageUrl)} alt={`Карта «${card.name}»`} fill sizes="(max-width: 1024px) 82vw, 360px" className="object-cover" priority />}
    </div>
    {HOTSPOTS.map((spot) => <button key={spot.id} type="button" onMouseEnter={() => onActivate(spot.id)} onFocus={() => onActivate(spot.id)} onClick={() => onActivate(spot.id)} className={`absolute rounded border transition focus:outline-none ${active === spot.id ? "border-gold bg-gold/20 shadow-[0_0_0_2px_rgba(212,175,55,.28)]" : "border-transparent hover:border-gold/80"}`} style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }} aria-label={spot.label} />)}
  </div>;
}

export function CardDetailV2({ card, tariff, secondary, hasSecondary, sphere }: { card: Archetype; tariff: Tariff; secondary: boolean; hasSecondary: boolean; sphere: LifeSphere | null }) {
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("why");
  const full = tariff !== "FREE";
  const fallbackContent: Record<Tab, ReactNode> = {
    why: card.function ?? card.essence,
    name: <>{card.tagline ? `«${card.tagline}»` : ""}{card.archetypeType ? ` ${card.archetypeType}` : ""}</>,
    where: <ul className="space-y-3">{asBullets(card.inLife).map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}</ul>,
    meaning: card.essence,
    reverse: card.shadowSide ?? "У этой карты нет отдельного описания обратной стороны.",
  };
  const expandedContent = activeTab === "meaning"
    ? sphereMeaningSection(card.extendedDescription, sphere) ?? extendedSection(card.extendedDescription, activeTab) ?? fallbackContent[activeTab]
    : activeTab === "reverse"
      ? [extendedSection(card.extendedDescription, activeTab), sphereReverseSection(card.extendedDescription, sphere)].filter(Boolean).join("\n\n") || fallbackContent[activeTab]
      : extendedSection(card.extendedDescription, activeTab) ?? fallbackContent[activeTab];

  return <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
    <div className="flex items-center justify-end border-b border-void-border pb-5"><Link href="/today" className="rounded border border-void-border bg-void-elevated px-3 py-2 font-technical text-[10px] uppercase tracking-widest text-bone hover:border-gold">К карте дня</Link></div>

    <header className="mx-auto max-w-4xl py-7 text-center sm:py-10"><p className="inline-block rounded-md bg-red-primary px-4 py-2 font-technical text-[10px] uppercase tracking-[0.2em] text-[#fff8e6] shadow-sm">Как пользоваться картой</p><h1 className="mt-3 font-display text-3xl leading-tight text-parchment-hi sm:text-5xl">Заметил · назвал · шагнул</h1><div className="mt-5 grid gap-2 text-left sm:mt-7 md:grid-cols-3"><article className="rounded-xl border border-void-border bg-void-elevated/95 p-4 sm:rounded-2xl sm:p-5"><p className="font-technical text-[10px] uppercase tracking-[0.18em] text-red-primary">01 · Заметил</p><p className="mt-2 font-body text-sm leading-relaxed text-bone sm:mt-3 sm:text-base">Посмотри на карту. Что первым отозвалось?</p></article><article className="rounded-xl border border-void-border bg-void-elevated/95 p-4 sm:rounded-2xl sm:p-5"><p className="font-technical text-[10px] uppercase tracking-[0.18em] text-red-primary">02 · Назвал</p><p className="mt-2 font-body text-sm leading-relaxed text-bone sm:mt-3 sm:text-base">Назови состояние своими словами.</p></article><article className="rounded-xl border border-void-border bg-void-elevated/95 p-4 sm:rounded-2xl sm:p-5"><p className="font-technical text-[10px] uppercase tracking-[0.18em] text-red-primary">03 · Шагнул</p><p className="mt-2 font-body text-sm leading-relaxed text-bone sm:mt-3 sm:text-base">Выбери один небольшой шаг на сегодня.</p></article></div></header>

    <div className="flex flex-col gap-8 pt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] lg:gap-10 lg:pt-10">
      <main className="order-2 min-w-0 lg:order-1 lg:pr-4">
        <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-gold">С чего всё начинается</p>
        <h2 className="mt-3 font-display text-4xl leading-tight text-parchment-hi">Ты и одна карта</h2>
        <p className="mt-4 max-w-2xl font-body leading-relaxed text-bone-dim">Карта остаётся перед глазами. Наводи на её подписанные строки и листай текст в своём темпе — подсветка всегда показывает один и тот же смысл с обеих сторон.</p>
        <PrintedText card={card} active={activeField} onActivate={setActiveField} />
        <div className="mt-6 flex flex-wrap gap-3"><ShareAppLink />{!secondary && tariff === "PREMIUM" && <Link href={hasSecondary ? "/today/detail?card=second" : "/today#second-card"} className="rounded border-2 border-gold bg-gold/10 px-4 py-2 font-technical text-[10px] uppercase tracking-widest text-bone hover:bg-gold/20">{hasSecondary ? "Открыть вторую карту" : "Получить вторую карту"}</Link>}</div>
      </main>

      <aside className="order-1 lg:order-2 lg:sticky lg:top-8 lg:self-start"><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-gold">{secondary ? "Вторая карта" : "Карта дня"}</p><CardSurface card={card} active={activeField} onActivate={setActiveField} /></aside>
    </div>

    <section className="mt-12 border-t border-void-border pt-10">
      <p className="font-technical text-[10px] uppercase tracking-[0.2em] text-gold">Расширенное описание</p>
      <div role="tablist" aria-label="Разделы расширенного описания" className="mt-4 flex snap-x gap-2 overflow-x-auto overscroll-x-contain pb-3">
        {TABS.map((tab) => <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`min-h-11 shrink-0 snap-start rounded-full border px-4 py-2.5 font-technical text-[11px] uppercase tracking-wide transition sm:text-xs ${activeTab === tab.id ? "border-red-primary bg-red-primary text-[#fff8e6]" : "border-void-border bg-void-elevated text-bone hover:border-gold"}`}>{tab.label}</button>)}
      </div>
      <article className="mt-3 min-h-52 rounded-2xl border border-void-border bg-void-elevated/95 p-4 shadow-[0_18px_50px_-35px_rgba(42,27,19,.75)] sm:mt-5 sm:p-8">
        {full ? <><h2 className="inline-block rounded bg-red-primary px-3 py-2 font-technical text-[10px] uppercase tracking-[0.16em] text-[#fff8e6] sm:text-xs">{TABS.find((tab) => tab.id === activeTab)?.label}</h2><div className="mt-5"><RichDescription value={expandedContent} /></div></> : <><h2 className="inline-block rounded bg-red-primary px-3 py-2 font-technical text-[10px] uppercase tracking-[0.16em] text-[#fff8e6] sm:text-xs">Что это значит</h2><div className="mt-5"><RichDescription value={fallbackContent.meaning} /></div><div className="mt-7 border-t border-void-border pt-6"><p className="font-display text-2xl text-parchment-hi">Полное чтение — с тарифом «Стандарт»</p><Link href="/tariffs" className="mt-4 inline-block min-h-11 rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6]">Смотреть тарифы</Link></div></>}
      </article>
    </section>
  </div>;
}
