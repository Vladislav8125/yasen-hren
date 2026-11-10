"use client";

import { useState } from "react";

export function BusinessLeadDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/business/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          website: form.get("website"),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Не удалось отправить заявку. Попробуйте ещё раз.");
      else setSent(true);
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(false); setError(""); }}
        className="mt-5 rounded-xl bg-red-primary px-5 py-3 font-technical text-xs font-bold uppercase tracking-wider text-[#fff8e9] transition hover:bg-red-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-primary"
      >
        Обсудить задачу
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="business-lead-title" className="relative w-full max-w-md rounded-2xl border border-gold/50 bg-[#fffaf0] p-6 text-ink shadow-2xl sm:p-8">
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="absolute right-4 top-3 p-2 text-2xl text-bone-dim hover:text-ink">×</button>
            {sent ? (
              <div role="status" className="py-8 text-center">
                <h2 id="business-lead-title" className="font-display text-2xl">Заявка отправлена</h2>
                <p className="mt-3 font-body text-bone-dim">Мы свяжемся с вами, чтобы обсудить задачу.</p>
                <button type="button" onClick={() => setOpen(false)} className="mt-6 rounded-lg bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-wider text-white">Закрыть</button>
              </div>
            ) : (
              <>
                <p className="font-technical text-xs uppercase tracking-widest text-red-primary">Корпоративная программа</p>
                <h2 id="business-lead-title" className="mt-2 font-display text-2xl">Обсудить задачу</h2>
                <p className="mt-2 font-body text-sm leading-relaxed text-bone-dim">Оставьте контакты — обсудим формат для вашей команды.</p>
                <form onSubmit={submit} className="mt-6 grid gap-4">
                  <label className="font-body text-sm">ФИО<input required name="name" autoComplete="name" className="mt-1 w-full rounded-lg border border-gold/50 bg-white px-3 py-3" /></label>
                  <label className="font-body text-sm">Телефон<input required name="phone" type="tel" autoComplete="tel" className="mt-1 w-full rounded-lg border border-gold/50 bg-white px-3 py-3" /></label>
                  <label className="font-body text-sm">Сайт <span className="text-bone-dim">(необязательно)</span><input name="website" type="url" placeholder="https://" className="mt-1 w-full rounded-lg border border-gold/50 bg-white px-3 py-3" /></label>
                  {error && <p role="alert" className="font-body text-sm text-red-primary">{error}</p>}
                  <button disabled={loading} className="rounded-lg bg-red-primary px-5 py-3 font-technical text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60">{loading ? "Отправляем…" : "Отправить заявку"}</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
