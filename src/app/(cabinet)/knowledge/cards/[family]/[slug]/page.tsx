import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { effectiveTariff, canUserAccess } from "@/lib/access";
import { familyLabel, knowledgeSlug } from "@/lib/knowledge";

export default async function KnowledgeCardPage({ params }: { params: Promise<{ family: string; slug: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { family, slug } = await params;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const tariff = effectiveTariff(user);
  const cards = await prisma.archetype.findMany({ where: { family: family.toUpperCase() as never } });
  const card = cards.find((c) => knowledgeSlug(c.name) === slug);
  if (!card) notFound();
  const familyValue = family.toUpperCase();
  const shortFields = [["Свойство", card.property], ["Архетип", card.archetypeType], ["Суть", card.essence], ["Функция", card.function], ["В жизни", card.inLife], ["Ритуал", card.ritual], ["Вопрос карты", card.cardQuestion], ["Тень", card.shadowSide]] as const;
  const hasRedFlag = familyValue === "SHADOW" || familyValue === "LIMINAL";
  const hasExtended = canUserAccess(tariff, "EXTENDED_CARD_CONTENT");

  return (
    <article className="mx-auto w-full max-w-5xl p-6 py-10 md:p-12">
      <Link href={`/knowledge/cards/${family}`} className="font-technical text-xs uppercase tracking-widest text-gold">← {familyLabel(familyValue)}</Link>
      <div className="mt-10 grid gap-8 md:grid-cols-[280px_1fr]">
        {card.imageUrl && <Image src={card.imageUrl} alt={card.name} width={700} height={980} className="w-full rounded-2xl shadow-lg" />}
        <div>
          <p className="font-technical text-xs uppercase tracking-widest text-gold">{familyLabel(familyValue)}</p>
          <h1 className="mt-2 font-display text-4xl text-parchment-hi">{card.name}</h1>
          <p className="mt-2 font-body text-lg italic text-bone-dim">«{card.tagline}»</p>
          <div className="mt-8 space-y-5">
            {shortFields.map(([label, value]) => value && <section key={label}><h2 className="font-technical text-xs uppercase tracking-widest text-gold">{label}</h2><p className="mt-1 font-body leading-relaxed text-bone">{value}</p></section>)}
          </div>

          {hasExtended ? (
            (card.extendedDescription || card.usageInstruction) && (
              <section className="mt-8 rounded-xl border-2 border-gold/60 bg-gold/10 p-5">
                <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright">Расширенное описание</h2>
                {card.extendedDescription && <div className="mt-4"><h3 className="font-technical text-xs uppercase tracking-widest text-gold">Развёрнутое описание</h3><p className="mt-1 whitespace-pre-line font-body leading-relaxed text-bone">{card.extendedDescription}</p></div>}
                {card.usageInstruction && <div className="mt-4"><h3 className="font-technical text-xs uppercase tracking-widest text-gold">Инструкция как пользоваться</h3><p className="mt-1 whitespace-pre-line font-body leading-relaxed text-bone">{card.usageInstruction}</p></div>}
              </section>
            )
          ) : (card.extendedDescription || card.usageInstruction) ? (
            <div className="mt-8 rounded-xl border border-dashed border-gold/60 bg-gold/5 p-4 text-center"><p className="font-technical text-xs uppercase tracking-widest text-gold">Расширенное описание доступно с тарифом «Стандарт»</p><Link href="/tariffs" className="mt-3 inline-block rounded bg-red-primary px-4 py-2 font-technical text-xs uppercase tracking-widest text-parchment">Смотреть тарифы</Link></div>
          ) : null}

          {card.clinicalFlag && <div className="mt-8 rounded-xl border border-red-warning bg-red-warning/10 p-4 font-body text-sm text-bone">{hasRedFlag && <p className="mb-1 font-technical text-xs uppercase tracking-widest text-red-warning">⚠ Красный флаг</p>}<p className="text-red-warning">{card.clinicalFlag}</p></div>}
        </div>
      </div>
    </article>
  );
}
