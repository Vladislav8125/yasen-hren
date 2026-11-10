import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { landingTeam } from "@/data/team";

export default async function KnowledgeTeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <Link href="/knowledge" className="font-technical text-xs uppercase tracking-widest text-gold">
        ← База знаний
      </Link>
      <p className="mt-10 font-technical text-xs uppercase tracking-widest text-gold">
        Команда
      </p>
      <h1 className="mt-3 font-display text-4xl text-parchment-hi md:text-5xl">
        Кто создаёт «Ясен Хрен».
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {landingTeam.map((member) => (
          <article
            key={member.name}
            className="overflow-hidden rounded-2xl border border-void-border bg-void-elevated"
          >
            <div className="relative aspect-[4/5] bg-parchment">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top"
              />
            </div>
            <div className="p-6">
              <h2 className="font-display text-xl text-parchment-hi">
                {member.name}
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-gold">
                {member.role}
              </p>
              <ul className="mt-5 space-y-2 border-t border-void-border pt-4">
                {member.credentials.map((credential) => (
                  <li
                    key={credential}
                    className="font-body text-sm leading-relaxed text-bone-dim before:mr-2 before:text-gold before:content-['•']"
                  >
                    {credential}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
