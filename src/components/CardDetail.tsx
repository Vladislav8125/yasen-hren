"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Archetype, Tariff } from "@/generated/prisma/client";
import { cardImageSrc } from "@/lib/cardImage";

type Part = "why" | "name" | "where" | "meaning" | "reverse" | "ritual" | "question" | "care";
const PARTS: Part[] = ["why", "name", "where", "meaning", "reverse", "ritual", "question", "care"];
const labels: Record<Part, string> = { why: "Почему тебе выпала эта карта", name: "Почему такое имя", where: "Где ты сейчас", meaning: "Что это значит", reverse: "Обратная сторона", ritual: "Ритуал · один шаг", question: "Вопрос карты", care: "Бережно" };
function bullets(value: string | null) { return (value ?? "").split(/\n|(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean).slice(0, 4); }

export function CardDetail({ card, tariff, secondary }: { card: Archetype; tariff: Tariff; secondary: boolean }) {
  const [active, setActive] = useState<Part>("why");
  const full = tariff !== "FREE";
  const content: Record<Part, React.ReactNode> = {
    why: card.function ?? card.essence,
    name: <>{card.tagline ? `«${card.tagline}»` : ""}{card.archetypeType ? ` ${card.archetypeType}` : ""}</>,
    where: <ul className="space-y-2">{bullets(card.inLife).map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}</ul>,
    meaning: card.essence,
    reverse: card.shadowSide ?? "У этой карты нет отдельного описания обратной стороны.",
    ritual: card.ritual ?? "Выбери один маленький шаг, который можно сделать сегодня.",
    question: card.cardQuestion ?? "Что эта карта предлагает заметить сегодня?",
    care: card.clinicalFlag ?? "Карта — спутник для размышления, но не замена врачу или психологу.",
  };
  const visible = full ? PARTS : ["meaning"] as Part[];
  return <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8"><div className="flex items-center justify-between gap-4 border-b border-void-border pb-5"><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-gold">Расширенное описание</p><Link href="/today" className="rounded border border-void-border bg-void-elevated px-3 py-2 font-technical text-[10px] uppercase tracking-widest text-bone hover:border-gold">К карте дня</Link></div><div className="grid gap-10 pt-10 lg:grid-cols-[minmax(17rem,.72fr)_minmax(0,1fr)]"><aside className="lg:sticky lg:top-8 lg:self-start"><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-red-primary">{secondary ? "Вторая карта" : "Карта дня"}</p><h1 className="mt-3 font-display text-5xl text-parchment-hi">{card.name}</h1><p className="mt-2 font-body italic text-bone-dim">«{card.tagline}»</p><p className="mt-6 font-body text-sm leading-relaxed text-bone-dim">Нажимай на выделенные поля карты: связанный раздел справа будет подсвечен. Прокручивай чтение в своём темпе.</p><div className="relative mt-6 mx-auto max-w-sm"><div className="relative aspect-[20/41] overflow-hidden rounded-[1.3rem] border border-gold/50 shadow-xl">{card.imageUrl && <Image src={cardImageSrc(card.imageUrl)} alt={card.name} fill sizes="(max-width: 1024px) 82vw, 360px" className="object-cover" />}</div>{PARTS.map((part, index) => <button key={part} type="button" onMouseEnter={() => setActive(part)} onFocus={() => setActive(part)} onClick={() => setActive(part)} className={`absolute left-[8%] right-[8%] h-[7.8%] rounded border transition ${active === part ? "border-gold bg-gold/20" : "border-transparent hover:border-gold/70"}`} style={{ top: `${10 + index * 10.1}%` }} aria-label={labels[part]} />)}</div></aside><main><p className="font-technical text-[10px] uppercase tracking-[0.2em] text-gold">Расширенное описание</p><h2 className="mt-3 font-display text-5xl leading-none text-parchment-hi">{card.name}</h2>{!full && <div className="mt-8 border border-gold/50 bg-gold/5 p-6"><p className="font-display text-2xl text-parchment-hi">Полное чтение — с тарифом «Стандарт»</p><p className="mt-3 font-body text-bone-dim">Сейчас доступен краткий смысл карты. Полный разбор, практики и вопросы откроются с тарифом «Стандарт».</p><Link href="/tariffs" className="mt-5 inline-block rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-[#fff8e6]">Смотреть тарифы</Link></div>}<div className="mt-8 divide-y divide-void-border border-y border-void-border">{visible.map((part) => <section key={part} onMouseEnter={() => setActive(part)} className={`py-7 transition ${active === part ? "bg-gold/5 -mx-4 px-4" : ""}`}><p className="font-technical text-[10px] uppercase tracking-[0.19em] text-red-primary">{labels[part]}</p><div className="mt-3 whitespace-pre-line font-body text-lg leading-relaxed text-bone">{content[part]}</div></section>)}</div></main></div></div>;
}
