"use client";

import { useState } from "react";
import { previewBroadcast, sendBroadcast, sendBroadcastTestMessage } from "./actions";
import type { BroadcastChannel, BroadcastResult, BroadcastSegment } from "@/lib/notifications";

type ActionResult = BroadcastResult & { error?: string };

const initialResult: BroadcastResult = { total: 0, sent: 0, failed: 0, attempted: 0, blocked: 0 };

const segmentLabels: Record<BroadcastSegment, string> = {
  ALL: "Все пользователи",
  FREE: "Free",
  STANDARD: "Стандарт",
  PREMIUM: "Премиум (включая пробный доступ)",
};

const channelLabels: Record<BroadcastChannel, string> = {
  ALL: "Все каналы",
  TELEGRAM: "Telegram",
  VK: "VK",
  MAX: "MAX",
};

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState<BroadcastSegment>("ALL");
  const [channel, setChannel] = useState<BroadcastChannel>("ALL");
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  const makeFormData = () => {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("segment", segment);
    formData.append("channel", channel);
    return formData;
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setResult(null);
    try {
      const res = await previewBroadcast(makeFormData());
      if (res.error) setResult({ ...initialResult, error: res.error });
      else setRecipientCount(res.count);
    } catch {
      setResult({ ...initialResult, error: "Не удалось рассчитать получателей" });
    } finally {
      setPreviewing(false);
    }
  };

  const handleTest = async () => {
    if (message.trim().length < 10) return;
    setTesting(true);
    setResult(null);
    try {
      const res = await sendBroadcastTestMessage(makeFormData());
      setResult(res);
    } catch {
      setResult({ ...initialResult, error: "Ошибка тестовой отправки" });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return;

    const confirmed = window.confirm(
      `Отправить сообщение (${message.trim().length} символов)?\n\nСегмент: ${segmentLabels[segment]}\nКанал: ${channelLabels[channel]}\nПолучателей: ${recipientCount ?? "не рассчитано"}\n\nПосле подтверждения рассылка начнётся сразу.`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const res = await sendBroadcast(makeFormData());
      setResult(res);
      if (!res.error) {
        setMessage("");
        setRecipientCount(null);
      }
    } catch {
      setResult({ ...initialResult, error: "Ошибка отправки" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 p-6">
      <div className="text-center">
        <p className="font-technical text-xs uppercase tracking-widest text-gold">Админка</p>
        <h1 className="font-display text-3xl text-parchment-hi">Рассылка</h1>
        <p className="mt-2 font-body text-sm text-bone-dim">
          Выберите сегмент и канал. Перед массовой отправкой можно проверить число получателей и отправить тест администратору.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-technical text-xs uppercase tracking-widest text-gold">Сегмент</span>
            <select
              value={segment}
              onChange={(e) => { setSegment(e.target.value as BroadcastSegment); setRecipientCount(null); }}
              className="rounded-lg border-2 border-void-border bg-void-elevated px-3 py-3 font-body text-sm text-bone focus:border-gold focus:outline-none"
            >
              {Object.entries(segmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-technical text-xs uppercase tracking-widest text-gold">Канал</span>
            <select
              value={channel}
              onChange={(e) => { setChannel(e.target.value as BroadcastChannel); setRecipientCount(null); }}
              className="rounded-lg border-2 border-void-border bg-void-elevated px-3 py-3 font-body text-sm text-bone focus:border-gold focus:outline-none"
            >
              {Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Текст сообщения..."
          rows={8}
          className="w-full resize-y rounded-lg border-2 border-void-border bg-void-elevated p-4 font-body text-sm text-bone placeholder:text-bone-dim focus:border-gold focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="font-technical text-xs text-bone-dim">
            {message.length} / мин. 10 символов
          </span>
        </div>

        <div className="rounded-lg border border-void-border bg-void-elevated/60 p-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="rounded-lg border border-gold px-4 py-2 font-technical text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold/10 disabled:opacity-50"
            >
              {previewing ? "Считаю..." : "Показать получателей"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || sending || message.trim().length < 10}
              className="rounded-lg border border-teal px-4 py-2 font-technical text-xs uppercase tracking-widest text-teal transition-all hover:bg-teal/10 disabled:opacity-50"
            >
              {testing ? "Отправляю тест..." : "Отправить тест администратору"}
            </button>
            <button
              type="submit"
              disabled={sending || testing || message.trim().length < 10}
              className="rounded-lg bg-red-primary px-4 py-2 font-technical text-xs font-semibold uppercase tracking-widest text-parchment shadow-md transition-all hover:bg-red-primary-dark disabled:opacity-50"
            >
              {sending ? "Отправка..." : "Отправить рассылку"}
            </button>
          </div>
          {recipientCount !== null && (
            <p className="mt-3 font-body text-sm text-bone">
              В выбранный сегмент попадёт <b className="text-gold">{recipientCount}</b> пользователей.
              {channel === "ALL" && " При выборе всех каналов один пользователь может получить сообщение в нескольких подключённых каналах."}
            </p>
          )}
        </div>
      </form>

      {result && (
        <div className={`w-full max-w-xl rounded-lg border-2 p-4 text-center ${result.error ? "border-red-warning bg-red-primary-dark/10" : "border-gold bg-gold/5"}`}>
          {result.error ? (
            <p className="font-body text-sm text-red-warning">{result.error}</p>
          ) : (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-technical text-xs uppercase tracking-widest">
              <span className="text-bone">Всего пользователей: <b className="text-parchment-hi">{result.total}</b></span>
              <span className="text-teal">Отправлено: <b>{result.sent}</b></span>
              <span className="text-red-warning">Ошибок: <b>{result.failed}</b></span>
              <span className="text-bone-dim">Попыток по каналам: <b className="text-parchment-hi">{result.attempted ?? 0}</b></span>
              <span className="text-red-warning">Заблокировали: <b>{result.blocked ?? 0}</b></span>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-xl border-t border-void-border pt-6">
        <h2 className="mb-3 font-technical text-xs uppercase tracking-widest text-gold-bright">
          Каждый день — новый текст
        </h2>
        <p className="mb-3 font-body text-xs text-bone-dim">
          Напоминание генерируется через LLM (OpenRouter) — стиль Хормози + язык карт.
          Каждый день разный текст. Ниже — пример одного дня.
        </p>
        <pre className="whitespace-pre-wrap rounded-lg border border-void-border bg-void-elevated p-4 font-body text-xs leading-relaxed text-bone">
{`Карта дня уже на столе.

Каждое утро ты выбираешь: посмотреть правде в глаза
или прожить день на автопилоте. Карта не обещает,
что будет легко. Она обещает, что будет честно.

Сегодняшний архетип не предскажет будущее.
Он покажет тебе — где ты прячешься от себя самого.

Ты уже здесь. Остался один клик.

Открыть карту дня
↓`}
        </pre>
      </div>
    </div>
  );
}
