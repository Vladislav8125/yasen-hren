import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALL_KNOWLEDGE_DOCUMENTS, KNOWLEDGE_SECTIONS } from "@/data/knowledge";

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ q?: string; section?: string }> }) {
  const session = await auth(); if (!session?.user) redirect("/login");
  const { q = "", section = "" } = await searchParams; const query = q.trim().toLowerCase();
  const cards = await prisma.archetype.findMany({ orderBy: { name: "asc" } });
  const documents = ALL_KNOWLEDGE_DOCUMENTS.filter((d) => (!section || d.section === section) && (!query || `${d.title} ${d.description} ${d.paragraphs.join(" ")}`.toLowerCase().includes(query)));
  const visibleSections = KNOWLEDGE_SECTIONS.filter((s) => !section || s.slug === section);
  return <div className="flex flex-1 flex-col gap-8 p-6 md:p-10">
    <header className="mx-auto w-full max-w-6xl"><p className="font-technical text-xs uppercase tracking-widest text-gold">Академия хренологии «Ясен Хрен»</p><h1 className="font-display text-4xl text-parchment-hi">База знаний</h1><p className="mt-3 max-w-2xl font-body text-lg text-bone-dim">Место, где можно спокойно разобраться, что происходит внутри, как читать карту и куда сделать следующий шаг.</p></header>
    <form className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row"><input name="q" defaultValue={q} placeholder="Найти карту, понятие или материал..." className="flex-1 rounded-xl border border-void-border bg-void-elevated px-4 py-3 font-body text-bone outline-none focus:border-gold"/><select name="section" defaultValue={section} className="rounded-xl border border-void-border bg-void-elevated px-4 py-3 font-technical text-xs uppercase tracking-widest text-bone"><option value="">Все разделы</option>{KNOWLEDGE_SECTIONS.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}</select><button className="rounded-xl bg-red-primary px-6 py-3 font-technical text-xs uppercase tracking-widest text-parchment">Искать</button></form>
    <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">{visibleSections.map((s) => <Link key={s.slug} href={s.slug === "light" || s.slug === "shadow" || s.slug === "liminal" ? `/knowledge/cards/${s.slug}` : s.slug === "team" ? "/knowledge/team" : `/knowledge?section=${s.slug}`} className="group rounded-2xl border border-void-border bg-void-elevated p-5 transition hover:-translate-y-1 hover:border-gold"><p className="font-technical text-xs uppercase tracking-widest text-gold">{s.eyebrow}</p><h2 className="mt-2 font-display text-2xl text-parchment-hi">{s.title}</h2><p className="mt-2 font-body text-sm leading-relaxed text-bone-dim">{s.description}</p><p className="mt-5 font-technical text-xs uppercase tracking-widest text-red-primary">Открыть →</p></Link>)}</div>
    <section className="mx-auto w-full max-w-6xl"><div className="mb-4 flex items-end justify-between"><div><p className="font-technical text-xs uppercase tracking-widest text-gold">Материалы</p><h2 className="font-display text-3xl text-parchment-hi">Читайте в своём темпе</h2></div><span className="font-technical text-xs text-bone-dim">{documents.length} материалов · {cards.length} карт</span></div><div className="grid gap-3 md:grid-cols-2">{documents.map((d) => <Link key={d.slug} href={`/knowledge/${d.slug}`} className="rounded-xl border border-void-border bg-void-elevated p-5 hover:border-gold"><h3 className="font-display text-xl text-parchment-hi">{d.title}</h3><p className="mt-2 font-body text-sm text-bone-dim">{d.description}</p></Link>)}</div></section>
  </div>;
}
