export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-void-border bg-void-elevated p-8">
        <h1 className="font-display text-3xl text-parchment-hi text-center">{title}</h1>
        <p className="font-body italic text-bone-dim text-center mt-2 mb-8">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-4">
      <span className="block font-technical text-xs uppercase tracking-widest text-gold mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded border border-void-border bg-void px-3 py-2 font-body text-bone outline-none focus:border-gold"
      />
    </label>
  );
}
