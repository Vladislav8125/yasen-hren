import { prisma } from "@/lib/prisma";
import { PAYOUT_MINIMUM_KOPECKS } from "@/lib/partners";
import { payPartnerBalance } from "./actions";

const rub = (kopecks: number) => `${(kopecks / 100).toLocaleString("ru-RU")} ₽`;
const dayKey = (value: Date) => value.toISOString().slice(0, 10);

export default async function AdminPartnersPage() {
  const [partners, commissions, requests] = await Promise.all([
    prisma.partner.findMany({ include: { user: true, clicks: true, commissions: true }, orderBy: { createdAt: "desc" } }),
    prisma.referralCommission.findMany({ include: { partner: { include: { user: true } }, customer: true }, orderBy: { createdAt: "desc" } }),
    prisma.partnerRequest.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const validCommissions = commissions.filter((c) => c.status !== "VOID");
  const approved = commissions.filter((c) => c.status === "APPROVED");
  const total = validCommissions.reduce((sum, c) => sum + c.amount, 0);
  const paidTotal = commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.amount, 0);
  const clicks = partners.flatMap((partner) => partner.clicks);
  const now = new Date();
  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now); date.setDate(now.getDate() - index);
    const key = dayKey(date);
    const dayClicks = clicks.filter((c) => dayKey(c.createdAt) === key).length;
    const dayCommissions = validCommissions.filter((c) => dayKey(c.createdAt) === key);
    return { key, label: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }), clicks: dayClicks, orders: dayCommissions.filter((c) => c.shopOrderId).length, payments: dayCommissions.filter((c) => c.paymentId).length, amount: dayCommissions.reduce((sum, c) => sum + c.amount, 0) };
  }).reverse();
  const promoAmount = validCommissions.filter((c) => c.attributionSource === "promo").reduce((sum, c) => sum + c.amount, 0);
  const linkAmount = validCommissions.filter((c) => c.attributionSource === "link").reduce((sum, c) => sum + c.amount, 0);
  const promoStats = partners.map((partner) => ({
    code: partner.promoCode,
    uses: partner.commissions.filter((commission) => commission.attributionSource === "promo" && commission.status !== "VOID").length,
    amount: partner.commissions.filter((commission) => commission.attributionSource === "promo" && commission.status !== "VOID").reduce((sum, commission) => sum + commission.amount, 0),
  }));

  return <main className="p-6"><h1 className="font-display text-2xl text-parchment-hi">Партнёрская программа</h1><div className="mt-6 grid gap-4 md:grid-cols-5">{[["Партнёры", String(partners.length)],["Переходы", String(clicks.length)],["Начислено", rub(total)],["К выплате", rub(approved.reduce((sum, c) => sum + c.amount, 0))],["Выплачено", rub(paidTotal)]].map(([label, value]) => <div key={label} className="rounded border border-void-border bg-void-elevated p-4"><p className="font-technical text-[10px] uppercase text-bone-dim">{label}</p><p className="mt-2 font-display text-2xl text-gold-bright">{value}</p></div>)}</div><section className="mt-8 overflow-x-auto"><h2 className="font-display text-xl text-parchment-hi">Статистика по дням</h2><table className="mt-3 w-full min-w-160 font-body text-sm text-bone"><thead className="text-left font-technical text-[10px] uppercase text-bone-dim"><tr><th>Дата</th><th>Переходы</th><th>Заказы</th><th>Оплаты подписок</th><th>Начислено</th></tr></thead><tbody>{daily.map((d) => <tr key={d.key} className="border-t border-void-border"><td className="py-2">{d.label}</td><td>{d.clicks}</td><td>{d.orders}</td><td>{d.payments}</td><td className="text-gold-bright">{rub(d.amount)}</td></tr>)}</tbody></table><p className="mt-3 font-body text-sm text-bone-dim">По ссылкам: {rub(linkAmount)} · по промокодам: {rub(promoAmount)}</p></section><section className="mt-8 rounded border border-void-border bg-void-elevated p-4"><h2 className="font-display text-xl text-parchment-hi">Промокоды</h2><div className="mt-3 space-y-2">{promoStats.map((promo) => <div key={promo.code} className="flex justify-between border-b border-void-border pb-2 font-body text-sm text-bone"><code>{promo.code}</code><span>{promo.uses} использований · {rub(promo.amount)}</span></div>)}</div></section><section className="mt-8"><h2 className="font-display text-xl text-parchment-hi">Партнёры и выплаты</h2><div className="mt-3 space-y-3">{partners.map((partner) => { const due = partner.commissions.filter((c) => c.status === "APPROVED").reduce((sum, c) => sum + c.amount, 0); const sourcePromo = partner.commissions.filter((c) => c.attributionSource === "promo" && c.status !== "VOID").length; return <div key={partner.id} className="rounded border border-void-border bg-void-elevated p-4 font-body text-sm text-bone"><b>{partner.user.name}</b> · {partner.user.email}<br/><span className="text-bone-dim">/r/{partner.code} · промокод {partner.promoCode} · {partner.clicks.length} переходов · {partner.commissions.length} оплат/заказов · промокод использован {sourcePromo} раз · к выплате {rub(due)}</span>{partner.payoutDetails && <p className="mt-2 text-bone-dim">Реквизиты: {partner.payoutDetails}</p>}{due >= PAYOUT_MINIMUM_KOPECKS && <form action={payPartnerBalance} className="mt-3"><input type="hidden" name="partnerId" value={partner.id}/><button className="rounded border border-gold px-3 py-2 font-technical text-xs uppercase text-gold-bright">Выплатить весь баланс {rub(due)}</button></form>}</div>; })}</div></section><section className="mt-8"><h2 className="font-display text-xl text-parchment-hi">Начисления</h2><div className="mt-3 space-y-2">{commissions.map((c) => <div key={c.id} className="rounded border border-void-border bg-void-elevated p-4 font-body text-sm text-bone">{c.partner.user.name} ← {c.customer.email} · {c.kind} · {c.attributionSource === "promo" ? "промокод" : "ссылка"} · {rub(c.amount)} · <span className="text-gold-bright">{c.status}</span></div>)}</div></section><section className="mt-8"><h2 className="font-display text-xl text-parchment-hi">Запросы на партнёрства</h2><div className="mt-3 space-y-2">{requests.length === 0 ? <p className="font-body text-bone-dim">Новых запросов нет.</p> : requests.map((request) => <div key={request.id} className="rounded border border-void-border bg-void-elevated p-4 font-body text-sm text-bone"><b>{request.type}</b> · {request.name} · {request.email}{request.company && ` · ${request.company}`}<p className="mt-1 text-bone-dim">{request.message}</p></div>)}</div></section></main>;
}
