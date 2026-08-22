"use client";

import { useState } from "react";

const landingUrl = "https://yasenhren.ru/landing";

export function ShareAppLink() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareData = {
      title: "Ясен Хрен",
      text: "Попробуй приложение «Ясен Хрен» — игра психологической гигиены.",
      url: landingUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        await navigator.clipboard.writeText(landingUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    }
  }

  return (
    <button type="button" onClick={share} className="font-technical text-xs uppercase tracking-widest text-gold underline underline-offset-4 hover:text-gold-bright">
      {copied ? "Ссылка скопирована" : "Поделиться с другом"}
    </button>
  );
}
