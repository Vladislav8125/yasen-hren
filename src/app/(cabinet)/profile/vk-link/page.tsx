import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVkLinkToken } from "@/lib/vkLink";

export default async function VkLinkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.vkUserId) redirect("/profile");

  const groupId = process.env.VK_GROUP_ID;
  if (!groupId) redirect("/profile");
  const token = createVkLinkToken(user.id);
  const chatUrl = `https://vk.com/im?sel=-${groupId}`;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-lg border border-void-border bg-void-elevated p-8">
        <Link href="/profile" className="font-technical text-xs uppercase tracking-widest text-gold hover:text-gold-bright">← Профиль</Link>
        <p className="mt-8 font-technical text-xs uppercase tracking-widest text-gold">Привязка VK</p>
        <h1 className="mt-2 font-display text-3xl text-parchment-hi">Отправьте код боту</h1>
        <p className="mt-4 font-body leading-relaxed text-bone-dim">Скопируйте код ниже, откройте диалог с сообществом и отправьте его одним сообщением. Код действует 15 минут.</p>
        <textarea readOnly value={token} aria-label="Код привязки VK" className="mt-6 min-h-28 w-full resize-none rounded border border-gold/50 bg-void p-3 font-mono text-xs text-bone outline-none" />
        <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full rounded bg-red-primary py-2.5 text-center font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Открыть чат VK</a>
      </section>
    </main>
  );
}
