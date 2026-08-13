-- Фактическая сумма заказа и раздельная аналитика ссылки/промокода.
ALTER TABLE "ShopOrder" ADD COLUMN "amount" INTEGER;
ALTER TABLE "ReferralCommission" ADD COLUMN "attributionSource" TEXT NOT NULL DEFAULT 'link';
