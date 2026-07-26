"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard, AuthField } from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <AuthCard title="Вход" subtitle="С возвращением">
      <form onSubmit={handleSubmit}>
        <AuthField label="Email" name="email" type="email" required autoComplete="email" />
        <AuthField
          label="Пароль"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        {error && <p className="font-body text-sm text-red-warning mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-red-primary py-2.5 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark disabled:opacity-50"
        >
          {loading ? "Секунду…" : "Войти"}
        </button>
      </form>
      <p className="font-body text-sm text-bone-dim text-center mt-6">
        Ещё нет аккаунта?{" "}
        <Link href="/register" className="text-gold hover:text-gold-bright">
          Зарегистрироваться
        </Link>
      </p>
    </AuthCard>
  );
}
