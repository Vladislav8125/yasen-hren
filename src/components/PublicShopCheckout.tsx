"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PersonalDataConsent } from "@/components/PersonalDataConsent";
import { findPublicShopProduct, rub } from "@/lib/public-shop";

type PriceQuote = {
  unitPriceRub: number;
  retailPriceRub: number;
  isPartnerPrice: boolean;
  attributionSource: "link" | "promo" | null;
};

export function PublicShopCheckout({
  deckMode = false,
  productParam = "",
  variantParam,
  sourceParam = "",
}: {
  deckMode?: boolean;
  productParam?: string;
  variantParam?: string;
  sourceParam?: string;
}) {
  const [deckVariant, setDeckVariant] = useState<"GLOSS" | "SOFT_TOUCH">(
    "GLOSS",
  );
  const product = useMemo(
    () =>
      findPublicShopProduct(
        deckMode ? "CARDS" : productParam,
        deckMode ? deckVariant : variantParam,
      ),
    [deckMode, deckVariant, productParam, variantParam],
  );
  const productId = product?.id ?? "";
  const variant = product?.variant;
  const source = sourceParam;
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const checkoutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        setQuoteLoading(true);
        setQuoteError("");
        try {
          const response = await fetch("/api/public-shop/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              variant,
              promoCode: promoCode.trim(),
            }),
            signal: controller.signal,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            setQuoteError(result.error ?? "Промокод не принят");
            return;
          }
          setQuote({
            unitPriceRub: result.unitPriceRub,
            retailPriceRub: result.retailPriceRub,
            isPartnerPrice: result.isPartnerPrice === true,
            attributionSource: result.attributionSource ?? null,
          });
        } catch (requestError) {
          if (
            !(
              requestError instanceof DOMException &&
              requestError.name === "AbortError"
            )
          )
            setQuoteError("Не удалось проверить цену");
        } finally {
          if (!controller.signal.aborted) setQuoteLoading(false);
        }
      },
      promoCode.trim() ? 350 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productId, variant, promoCode]);

  if (!product)
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-20">
        <h1 className="font-display text-3xl text-parchment-hi">
          Товар не найден
        </h1>
        <Link href="/shop" className="mt-5 inline-block text-gold">
          Вернуться в магазин
        </Link>
      </main>
    );
  const displayedPrice = quote?.unitPriceRub ?? product.priceRub;
  function scrollToCheckoutForm() {
    checkoutFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public-shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variant,
          source,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          quantity: form.get("quantity"),
          deliveryMethod: form.get("deliveryMethod"),
          deliveryAddress: form.get("deliveryAddress"),
          comment: form.get("comment"),
          promoCode: form.get("promoCode"),
          personalDataConsent: form.get("personalDataConsent") === "yes",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Не удалось оформить заказ");
      else if (
        typeof result.paymentUrl !== "string" ||
        !result.paymentUrl.startsWith("https://")
      )
        setError(
          "Платёжная ссылка не создана. Заказ не завершён — попробуйте позже или свяжитесь с поддержкой.",
        );
      else {
        window.location.assign(result.paymentUrl);
      }
    } catch {
      setError(
        "Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-5 md:max-w-2xl md:px-6 md:py-10">
      <p className="font-technical text-[10px] uppercase tracking-widest text-gold">
        Оформление заказа
      </p>
      <h1 className="mt-2 font-display text-3xl text-parchment-hi md:text-4xl">
        {deckMode ? "Колода «Ясен Хрен»" : product.title}
      </h1>
      {deckMode && (
        <fieldset className="mt-5 grid gap-2">
          <legend className="mb-2 font-body text-sm text-bone">
            Выберите покрытие
          </legend>
          {(["GLOSS", "SOFT_TOUCH"] as const).map((option) => {
            const optionProduct = findPublicShopProduct("CARDS", option)!;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${deckVariant === option ? "border-gold bg-gold/10" : "border-void-border bg-void-elevated"}`}
              >
                <span>
                  <input
                    type="radio"
                    name="deckVariant"
                    value={option}
                    checked={deckVariant === option}
                    onChange={() => setDeckVariant(option)}
                    className="mr-3 accent-red-primary"
                  />
                  {option === "GLOSS" ? "Глянец" : "Софт-тач"}
                </span>
                <span className="font-display text-xl text-red-primary">
                  {rub(optionProduct.priceRub)}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
      {!deckMode && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-bone-dim">
          <span>{product.format} ·</span>
          <span className="font-display text-2xl text-red-primary">
            {rub(displayedPrice)}
          </span>
          {quote?.isPartnerPrice && (
            <del className="text-sm text-bone-dim">
              {rub(quote.retailPriceRub)}
            </del>
          )}
        </div>
      )}
      {deckMode && (
        <button
          type="button"
          onClick={scrollToCheckoutForm}
          className="mt-4 w-full rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment hover:bg-red-primary-dark"
        >
          К контактам и доставке ↓
        </button>
      )}
      {quote?.isPartnerPrice && (
        <p className="mt-1 font-technical text-[10px] uppercase tracking-widest text-gold">
          Цена по партнёрской ссылке
        </p>
      )}
      {quoteLoading && (
        <p className="mt-1 font-body text-xs text-bone-dim">Проверяем цену…</p>
      )}
      {quoteError && (
        <p className="mt-2 font-body text-sm text-red-warning" role="status">
          {quoteError}
        </p>
      )}
      <form
        ref={checkoutFormRef}
        onSubmit={submit}
        className="mt-6 scroll-mt-4 grid gap-3 rounded-2xl border border-void-border bg-void-elevated p-4 md:gap-4 md:p-7"
      >
        {deckMode && (
          <div className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 font-body text-sm text-bone">
            {deckVariant === "GLOSS" ? "Глянец" : "Софт-тач"} ·{" "}
            {rub(displayedPrice)}
          </div>
        )}
        <label className="font-body text-sm text-bone">
          ФИО
          <input
            required
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
          />
        </label>
        <label className="font-body text-sm text-bone">
          Email для чека и связи
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
          />
        </label>
        <label className="font-body text-sm text-bone">
          Телефон
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
          />
        </label>
        {product.requiresDelivery && (
          <>
            <label className="font-body text-sm text-bone">
              Способ доставки
              <select
                required
                name="deliveryMethod"
                defaultValue="CDEK"
                className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
              >
                <option value="CDEK">СДЭК</option>
                <option value="RUSSIAN_POST">Почта России</option>
                <option value="COURIER">
                  Курьер — согласовать с менеджером
                </option>
              </select>
            </label>
            <label className="font-body text-sm text-bone">
              Адрес доставки
              <textarea
                required
                name="deliveryAddress"
                className="mt-1 min-h-20 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
              />
            </label>
          </>
        )}
        {!deckMode && (
          <label className="font-body text-sm text-bone">
            Количество
            <input
              name="quantity"
              type="number"
              min="1"
              max="10"
              defaultValue="1"
              className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
            />
          </label>
        )}
        {deckMode ? (
          <details className="rounded-lg border border-void-border px-3 py-2">
            <summary className="cursor-pointer font-body text-sm text-bone-dim">
              Есть промокод?
            </summary>
            <input
              name="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="Введите промокод"
              className="mt-3 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
            />
          </details>
        ) : (
          <label className="font-body text-sm text-bone">
            Промокод
            <input
              name="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder="Если он у вас есть"
              className="mt-1 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
            />
          </label>
        )}
        {!deckMode && (
          <label className="font-body text-sm text-bone">
            Комментарий
            <textarea
              name="comment"
              className="mt-1 min-h-20 w-full rounded border border-void-border bg-void px-3 py-2 text-bone"
            />
          </label>
        )}
        <label className="flex gap-3 font-body text-xs leading-relaxed text-bone-dim">
          <input
            required
            name="offerAccepted"
            type="checkbox"
            className="mt-1 size-4 accent-red-primary"
          />
          <span>
            Принимаю условия{" "}
            <Link
              href="/policies/offer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-2"
            >
              публичной оферты
            </Link>{" "}
            и{" "}
            <Link
              href="/policies/refunds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline underline-offset-2"
            >
              порядка возврата
            </Link>
            .
          </span>
        </label>
        <PersonalDataConsent />
        {error && <p className="font-body text-sm text-red-warning">{error}</p>}
        <button
          disabled={loading}
          className="rounded bg-red-primary px-5 py-3 font-technical text-xs uppercase tracking-widest text-parchment disabled:opacity-50"
        >
          {loading ? "Создаём заказ…" : "Перейти к оплате в Robokassa"}
        </button>
      </form>
    </main>
  );
}
