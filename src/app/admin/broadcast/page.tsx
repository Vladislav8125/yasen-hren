"use client";

import { useState } from "react";
import { sendBroadcast } from "./actions";
import type { BroadcastResult } from "@/lib/notifications";

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<(BroadcastResult & { error?: string }) | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return;

    setSending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("message", message);

    try {
      const res = await sendBroadcast(formData);
      setResult(res);
      if (!res.error) setMessage("");
    } catch (err) {
      setResult({ total: 0, sent: 0, failed: 0, error: "Ошибка отправки" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Админка</p>
        <h1 className="font-display text-3xl text-parchment-hi">Рассылка</h1>
        <p className="font-body text-sm text-bone-dim mt-2">
          Сообщение отправится всем пользователям, привязавшим Telegram или VK
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Текст сообщения..."
          rows={8}
          className="w-full rounded-lg border-2 border-void-border bg-void-elevated p-4 font-body text-sm text-bone placeholder:text-bone-dim resize-y focus:border-gold focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="font-technical text-xs text-bone-dim">
            {message.length} / мин. 10 символов
          </span>
          <button
            type="submit"
            disabled={sending || message.trim().length < 10}
            className="rounded-lg bg-red-primary px-8 py-3 font-technical text-xs font-semibold uppercase tracking-widest text-parchment shadow-md hover:bg-red-primary-dark disabled:opacity-50 transition-all"
          >
            {sending ? "Отправка..." : "Отправить всем"}
          </button>
        </div>
      </form>

      {result && (
        <div className={`w-full max-w-xl rounded-lg border-2 p-4 text-center ${result.error ? "border-red-warning bg-red-primary-dark/10" : "border-gold bg-gold/5"}`}>
          {result.error ? (
            <p className="font-body text-sm text-red-warning">{result.error}</p>
          ) : (
            <div className="flex justify-center gap-6 font-technical text-xs uppercase tracking-widest">
              <span className="text-bone">Всего: <b className="text-parchment-hi">{result.total}</b></span>
              <span className="text-teal">Отправлено: <b>{result.sent}</b></span>
              <span className="text-red-warning">Ошибок: <b>{result.failed}</b></span>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-xl border-t border-void-border pt-6">
        <h2 className="font-technical text-xs uppercase tracking-widest text-gold-bright mb-3">
          Каждый день — новый текст
        </h2>
        <p className="font-body text-xs text-bone-dim mb-3">
          Напоминание генерируется через LLM (OpenRouter) — стиль Хормози + язык карт.
          Каждый день разный текст. Ниже — пример одного дня.
        </p>
        <pre className="whitespace-pre-wrap rounded-lg border border-void-border bg-void-elevated p-4 font-body text-xs text-bone leading-relaxed">
{`Карта дня уже на столе.

Каждое утро ты выбираешь: посмотреть правде в глаза
или прожить день на автопилоте. Карта не обещает,
что будет легко. Она обещает, что будет честно.

Сегодняшний архетип не предскажет будущее.
Он покажет тебе — где ты прячешься от себя самого.

Ты уже здесь. Остался один клик.

Открыть карту дня → yasen-hren.ru/today`}
        </pre>
      </div>
    </div>
  );
}
