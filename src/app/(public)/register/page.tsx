"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard, AuthField } from "@/components/AuthCard";
import { PersonalDataConsent } from "@/components/PersonalDataConsent";
import { NewsletterConsent } from "@/components/NewsletterConsent";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<"FREE" | "STANDARD" | "PREMIUM" | "">("");
  const [selectedChannel, setSelectedChannel] = useState("TELEGRAM");

  useEffect(() => {
    const tariff = new URLSearchParams(window.location.search).get("tariff")?.toUpperCase();
    if (tariff === "FREE" || tariff === "STANDARD" || tariff === "PREMIUM") setSelectedTariff(tariff);
    const channel = new URLSearchParams(window.location.search).get("channel")?.toUpperCase();
    if (channel === "TELEGRAM" || channel === "VK" || channel === "MAX") setSelectedChannel(channel);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone"),
      promoCode: form.get("promoCode"),
      personalDataConsent: form.get("personalDataConsent") === "yes",
      marketingConsent: form.get("marketingConsent") === "yes",
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не удалось зарегистрироваться");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Регистрация прошла, но вход не удался — попробуйте войти вручную");
      return;
    }

    router.push(selectedTariff ? `/tariffs?select=${selectedTariff}&channel=${selectedChannel}` : "/today");
    router.refresh();
  }

  return (
    <AuthCard title="Регистрация" subtitle="Ясен хрен, начнём">
      {selectedTariff && <div className="mb-6 rounded border border-gold/40 bg-gold/5 p-4 font-body text-sm leading-relaxed text-bone">После регистрации откроется выбранный тариф: <b>{selectedTariff}</b>. Там можно сразу завершить оформление.</div>}
      <div className="mb-6 space-y-2 rounded border border-gold/40 bg-gold/5 p-4 font-body text-sm leading-relaxed text-bone">
        <p>После регистрации вам регулярно будет доступна новая карта дня.</p>
        <p>Получать карты можно в веб-приложении, Telegram и ВКонтакте — выберите удобный канал.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <AuthField label="Имя" name="name" type="text" required autoComplete="name" />
        <AuthField label="Email" name="email" type="email" required autoComplete="email" />
        <AuthField
          label="Телефон (необязательно)"
          name="phone"
          type="tel"
          autoComplete="tel"
        />
        <div className="mb-4">
          <PersonalDataConsent />
        </div>
        <div className="mb-4">
          <NewsletterConsent />
        </div>
        <AuthField label="Промокод (необязательно)" name="promoCode" type="text" autoComplete="off" />
        <AuthField
          label="Пароль"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error && <p className="font-body text-sm text-red-warning mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark disabled:opacity-50"
        >
          {loading ? "Секунду…" : "Зарегистрироваться"}
        </button>
      </form>
      <p className="font-body text-sm text-bone-dim text-center mt-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Войти
        </Link>
      </p>
    </AuthCard>
  );
}
