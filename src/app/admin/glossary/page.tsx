import { prisma } from "@/lib/prisma";
import { addModeratorComment, updateFeedbackStatus } from "./actions";

const STATUS_LABEL = {
  OPEN: "Новое",
  PLANNED: "Запланировано",
  IN_PROGRESS: "В работе",
  COMPLETED: "Готово",
  CLOSED: "Закрыто",
} as const;

export default async function AdminFeedbackPage() {
  const posts = await prisma.feedbackPost.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, email: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <p className="font-technical text-xs uppercase tracking-widest text-gold">Продуктовая очередь</p>
      <h1 className="mt-2 font-display text-3xl text-parchment-hi">Обратная связь</h1>
      <p className="mt-2 font-body text-bone-dim">Меняйте статусы и отвечайте пользователям прямо в обсуждении.</p>

      <div className="mt-8 space-y-5">
        {posts.length === 0 ? <p className="font-body text-bone-dim">Обращений пока нет.</p> : posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-void-border bg-void-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-parchment-hi">{post.title}</h2>
                <p className="mt-1 font-technical text-[10px] uppercase tracking-widest text-bone-dim">{post.author.name} · {post.author.email} · {post.createdAt.toLocaleDateString("ru-RU")}</p>
              </div>
              <form action={updateFeedbackStatus} className="flex items-center gap-2">
                <input type="hidden" name="postId" value={post.id} />
                <select name="status" defaultValue={post.status} className="rounded border border-void-border bg-void px-3 py-2 font-technical text-xs uppercase tracking-widest text-bone">
                  {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button className="rounded border border-gold px-3 py-2 font-technical text-xs uppercase tracking-widest text-gold hover:bg-gold/10">Сохранить</button>
              </form>
            </div>
            <p className="mt-4 whitespace-pre-wrap font-body leading-relaxed text-bone">{post.body}</p>

            <div className="mt-5 border-t border-void-border pt-4">
              <p className="font-technical text-xs uppercase tracking-widest text-gold">Обсуждение</p>
              {post.comments.length > 0 && <div className="mt-3 space-y-3">{post.comments.map((comment) => <div key={comment.id} className="rounded-lg bg-void p-3"><p className="font-technical text-[10px] uppercase tracking-widest text-bone-dim">{comment.author.name} · {comment.author.role}</p><p className="mt-1 whitespace-pre-wrap font-body text-sm text-bone">{comment.body}</p></div>)}</div>}
              <form action={addModeratorComment} className="mt-4 grid gap-3"><input type="hidden" name="postId" value={post.id} /><textarea name="body" required maxLength={3000} rows={3} placeholder="Ответ команды" className="resize-y rounded border border-void-border bg-void px-3 py-2 font-body text-bone" /><button className="justify-self-start rounded bg-red-primary px-4 py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark">Ответить</button></form>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
