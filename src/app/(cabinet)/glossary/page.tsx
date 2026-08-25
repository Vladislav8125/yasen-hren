import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addFeedbackComment, submitFeedback } from "./actions";

const STATUS_LABEL = {
  OPEN: "Новое",
  PLANNED: "Запланировано",
  IN_PROGRESS: "В работе",
  COMPLETED: "Готово",
  CLOSED: "Закрыто",
} as const;

const STATUS_STYLE = {
  OPEN: "border-gold/50 bg-gold/10 text-gold",
  PLANNED: "border-teal/50 bg-teal/10 text-teal",
  IN_PROGRESS: "border-red-primary/40 bg-red-primary/10 text-red-primary",
  COMPLETED: "border-green-600/40 bg-green-600/10 text-green-700",
  CLOSED: "border-void-border bg-void text-bone-dim",
} as const;

function dateLabel(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function FeedbackPage() {
  const session = await auth();
  const posts = await prisma.feedbackPost.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } },
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-10">
      <header className="mx-auto w-full max-w-4xl">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Продуктовая очередь</p>
        <h1 className="mt-2 font-display text-4xl text-parchment-hi">Обратная связь</h1>
        <p className="mt-3 max-w-2xl font-body leading-relaxed text-bone-dim">Задайте вопрос, сообщите о проблеме или предложите улучшение. Мы отвечаем в комментариях и отмечаем статус работы.</p>
      </header>

      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-void-border bg-void-elevated p-5 md:p-6">
        <h2 className="font-display text-2xl text-parchment-hi">Создать обращение</h2>
        {session?.user ? (
          <form action={submitFeedback} className="mt-5 grid gap-3">
            <input name="title" required maxLength={140} placeholder="Коротко: что хотите обсудить?" className="rounded-xl border border-void-border bg-void px-4 py-3 font-body text-bone outline-none focus:border-gold" />
            <textarea name="body" required maxLength={4000} rows={5} placeholder="Опишите задачу, вопрос или ситуацию. Чем конкретнее, тем быстрее получится ответить." className="resize-y rounded-xl border border-void-border bg-void px-4 py-3 font-body text-bone outline-none focus:border-gold" />
            <button className="justify-self-start rounded-lg bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Отправить</button>
          </form>
        ) : (
          <p className="mt-3 font-body text-bone-dim"><Link href="/login" className="text-gold hover:text-gold-bright">Войдите</Link>, чтобы создать обращение или оставить комментарий.</p>
        )}
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-void-border p-8 text-center font-body text-bone-dim">Пока нет обращений. Начните первое обсуждение.</div>
        ) : posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-void-border bg-void-elevated p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-parchment-hi">{post.title}</h2>
                <p className="mt-1 font-technical text-[10px] uppercase tracking-widest text-bone-dim">{post.author.name} · {dateLabel(post.createdAt)}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 font-technical text-[10px] uppercase tracking-widest ${STATUS_STYLE[post.status]}`}>{STATUS_LABEL[post.status]}</span>
            </div>
            <p className="mt-5 whitespace-pre-wrap font-body leading-relaxed text-bone">{post.body}</p>

            <div className="mt-6 border-t border-void-border pt-5">
              <p className="font-technical text-xs uppercase tracking-widest text-gold">Комментарии · {post.comments.length}</p>
              {post.comments.length > 0 && <div className="mt-4 space-y-4">{post.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-void p-4">
                  <p className="font-technical text-[10px] uppercase tracking-widest text-bone-dim">{comment.author.role === "ADMIN" || comment.author.role === "MODERATOR" ? "Команда Ясен Хрен" : comment.author.name} · {dateLabel(comment.createdAt)}</p>
                  <p className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-bone">{comment.body}</p>
                </div>
              ))}</div>}
              {session?.user && <form action={addFeedbackComment} className="mt-4 grid gap-3"><input type="hidden" name="postId" value={post.id} /><textarea name="body" required maxLength={3000} rows={3} placeholder="Написать комментарий" className="resize-y rounded-xl border border-void-border bg-void px-4 py-3 font-body text-bone outline-none focus:border-gold" /><button className="justify-self-start rounded border border-gold px-4 py-2.5 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10">Отправить комментарий</button></form>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
