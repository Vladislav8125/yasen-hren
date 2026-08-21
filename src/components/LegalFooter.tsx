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
        <p className="whitespace-nowrap">© Академия хренологии «Ясен Хрен»</p>
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
