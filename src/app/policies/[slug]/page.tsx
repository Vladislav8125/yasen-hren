import Link from "next/link";
import { notFound } from "next/navigation";
import policies from "@/data/policies.json";

type PolicyDocument = {
  slug: string;
  title: string;
  source: string;
  content: string;
};

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = (policies.documents as PolicyDocument[]).find((document) => document.slug === slug);

  if (!policy) notFound();

  return (
    <main className="flex flex-1 flex-col px-6 py-10 md:px-12 md:py-14">
      <article className="mx-auto w-full max-w-4xl">
        <Link href="/" className="font-mono text-xs uppercase tracking-[0.18em] text-acid transition-colors hover:text-bone">
          ← На главную
        </Link>
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-bone-muted">Правовые документы</p>
        <h1 className="mt-3 font-display text-4xl uppercase leading-tight text-bone md:text-6xl">{policy.title}</h1>
        <div className="mt-8 rounded-2xl border border-void-border bg-void-elevated p-6 md:p-10">
          <div className="whitespace-pre-wrap font-body text-base leading-relaxed text-bone">{policy.content}</div>
        </div>
      </article>
    </main>
  );
}
