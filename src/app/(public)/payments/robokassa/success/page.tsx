import Link from "next/link";

export default function RobokassaSuccessPage() {
  return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center p-6 text-center"><p className="font-technical text-xs uppercase tracking-widest text-gold">Оплата отправлена</p><h1 className="mt-3 font-display text-4xl text-parchment-hi">Проверяем платёж</h1><p className="mt-4 font-body text-bone-dim">Доступ откроется после серверного подтверждения от Robokassa. Это обычно занимает несколько секунд.</p><Link href="/profile" className="mt-8 rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment">В личный кабинет</Link></main>;
}
