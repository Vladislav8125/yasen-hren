import Link from "next/link";

export default function RobokassaFailPage() {
  return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center p-6 text-center"><p className="font-technical text-xs uppercase tracking-widest text-red-warning">Оплата не завершена</p><h1 className="mt-3 font-display text-4xl text-parchment-hi">Ничего не списано</h1><p className="mt-4 font-body text-bone-dim">Можно вернуться к тарифам и попробовать ещё раз.</p><Link href="/tariffs" className="mt-8 rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment">К тарифам</Link></main>;
}
