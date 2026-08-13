-- Партнёрская программа: 90-дневная атрибуция, промокоды и начисления.
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'PAUSED');
CREATE TYPE "PartnerRequestType" AS ENUM ('SPEAKING', 'EVENT_GAME', 'MEDIA');
CREATE TYPE "PartnerRequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "CommissionKind" AS ENUM ('SUBSCRIPTION', 'CARDS', 'CONSULTATION', 'GAME', 'MERCH');
CREATE TYPE "CommissionStatus" AS ENUM ('APPROVED', 'PAID', 'VOID');

ALTER TYPE "ShopProductId" ADD VALUE IF NOT EXISTS 'MERCH';

CREATE TABLE "Partner" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "promoCode" TEXT NOT NULL,
  "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "payoutDetails" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralClick" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "targetPath" TEXT NOT NULL DEFAULT '/',
  "referer" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralAttribution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastClickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralCommission" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "paymentId" TEXT,
  "shopOrderId" TEXT,
  "kind" "CommissionKind" NOT NULL,
  "baseAmount" INTEGER NOT NULL,
  "rateBps" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "CommissionStatus" NOT NULL DEFAULT 'APPROVED',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerRequest" (
  "id" TEXT NOT NULL,
  "type" "PartnerRequestType" NOT NULL,
  "status" "PartnerRequestStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "company" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");
CREATE UNIQUE INDEX "Partner_code_key" ON "Partner"("code");
CREATE UNIQUE INDEX "Partner_promoCode_key" ON "Partner"("promoCode");
CREATE UNIQUE INDEX "ReferralAttribution_userId_key" ON "ReferralAttribution"("userId");
CREATE UNIQUE INDEX "ReferralCommission_paymentId_key" ON "ReferralCommission"("paymentId");
CREATE UNIQUE INDEX "ReferralCommission_shopOrderId_key" ON "ReferralCommission"("shopOrderId");
CREATE INDEX "ReferralClick_partnerId_createdAt_idx" ON "ReferralClick"("partnerId", "createdAt");
CREATE INDEX "ReferralAttribution_partnerId_expiresAt_idx" ON "ReferralAttribution"("partnerId", "expiresAt");
CREATE INDEX "ReferralCommission_partnerId_status_createdAt_idx" ON "ReferralCommission"("partnerId", "status", "createdAt");

ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralAttribution" ADD CONSTRAINT "ReferralAttribution_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_shopOrderId_fkey" FOREIGN KEY ("shopOrderId") REFERENCES "ShopOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
