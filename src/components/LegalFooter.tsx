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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-center text-sm text-bone-muted md:flex-row md:items-center md:justify-between md:text-left">
        <p>© АХ Бытия «Ясен Хрен»</p>
        <nav aria-label="Правовые документы" className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:justify-end">
          {POLICY_LINKS.map((policy) => (
            <Link key={policy.slug} href={`/policies/${policy.slug}`} className="transition-colors hover:text-acid">
              {policy.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
