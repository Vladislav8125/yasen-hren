import Link from "next/link";

// Лендинг — plans/2026-07-26-yasen-hren-redesign-light-cabinet.md, Фаза B.
// Видео на весь экран (public/video/zastavka.mp4, 5 сек, автоплей без звука,
// зациклено) + кнопка входа в личный кабинет.

export default function Home() {
  return (
    <main className="relative flex flex-1 min-h-[85vh] items-center justify-center overflow-hidden rounded-lg">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/zastavka.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <Link
          href="/login"
          className="rounded bg-red-primary px-8 py-3.5 font-technical text-sm uppercase tracking-widest text-parchment shadow-lg hover:bg-red-primary-dark"
        >
          Войти в личный кабинет
        </Link>
      </div>
    </main>
  );
}
