import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#17100c] px-5">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/ях1.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/35" />

      <Link
        href="/login"
        className="relative z-10 rounded border border-[#fff8e6]/70 bg-[#7a1620]/90 px-8 py-4 font-technical text-xs uppercase tracking-[0.16em] text-[#fff8e6] shadow-lg transition hover:bg-[#5c0f17] focus:outline-none focus:ring-2 focus:ring-[#fff8e6] focus:ring-offset-2 focus:ring-offset-[#7a1620]"
      >
        Войти / зарегистрироваться
      </Link>
    </main>
  );
}
