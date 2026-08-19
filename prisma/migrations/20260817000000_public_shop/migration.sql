-- Публичные заказы из /shop. Не требуют регистрации пользователя.
CREATE TABLE "PublicShopOrder" (
    "id" TEXT NOT NULL,
    "product" "ShopProductId" NOT NULL,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "comment" TEXT,
    "promoCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProvider" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "PublicShopOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicShopOrder_paymentId_key" ON "PublicShopOrder"("paymentId");
CREATE INDEX "PublicShopOrder_status_createdAt_idx" ON "PublicShopOrder"("status", "createdAt");
CREATE INDEX "PublicShopOrder_email_createdAt_idx" ON "PublicShopOrder"("email", "createdAt");
