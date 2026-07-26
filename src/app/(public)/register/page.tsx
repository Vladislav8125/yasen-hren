"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard, AuthField } from "@/components/AuthCard";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    router.push("/profile");
    router.refresh();
  }

  return (
    <AuthCard title="Регистрация" subtitle="Ясен хрен, начнём">
      <form onSubmit={handleSubmit}>
        <AuthField label="Имя" name="name" type="text" required autoComplete="name" />
        <AuthField label="Email" name="email" type="email" required autoComplete="email" />
        <AuthField
          label="Телефон (необязательно)"
          name="phone"
          type="tel"
          autoComplete="tel"
        />
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
