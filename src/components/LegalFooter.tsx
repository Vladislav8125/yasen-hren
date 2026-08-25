import Image from "next/image";
import Link from "next/link";

const POLICY_LINKS = [
  { slug: "privacy", label: "Политика конфиденциальности" },
  { slug: "personal-data", label: "Обработка персональных данных" },
  { slug: "cookies", label: "Политика использования cookie" },
  { slug: "offer", label: "Публичная оферта" },
  { slug: "service-terms", label: "Условия предоставления услуг" },
  { slug: "refunds", label: "Возврат и отказ от покупки" },
];

export function LegalFooter() {
  return (
    <footer className="border-t border-void-border bg-void-elevated/90 px-6 py-6">
      <div className="mx-auto grid max-w-6xl gap-4 text-center text-sm text-bone-muted md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:text-left">
        <Link href="/landing" className="inline-flex items-center justify-center gap-3 whitespace-nowrap text-bone-muted transition-colors hover:text-parchment-hi md:justify-start">
          <span className="relative h-10 w-10 overflow-hidden rounded-full border border-gold/50 bg-parchment"><Image src="/landing/yasen-hren-logo.jpg" alt="" fill sizes="40px" className="object-cover object-[50%_20%]" /></span>
          <span>© Академия Хренологии Бытия «Ясен Хрен»</span>
        </Link>
        <nav aria-label="Правовые документы" className="grid grid-cols-2 gap-x-6 gap-y-2 text-left md:justify-self-end">
          {POLICY_LINKS.map((policy) => (
            <Link key={policy.slug} href={`/policies/${policy.slug}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-acid">
              {policy.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
