CREATE TYPE "PaymentProvider" AS ENUM ('YOOKASSA', 'ROBOKASSA');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCEL_AT_PERIOD_END', 'CANCELED', 'PAST_DUE');

ALTER TABLE "Payment"
  ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'YOOKASSA',
  ADD COLUMN "robokassaInvoiceId" TEXT,
  ADD COLUMN "robokassaParentInvoiceId" TEXT,
  ADD COLUMN "recurring" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Payment_robokassaInvoiceId_key" ON "Payment"("robokassaInvoiceId");

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'ROBOKASSA',
  "tariff" "Tariff" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "initialInvoiceId" TEXT NOT NULL,
  "lastInvoiceId" TEXT,
  "lastPaymentAt" TIMESTAMP(3),
  "nextChargeAt" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "cancelRequestedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "reminderSentFor" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_initialInvoiceId_key" ON "Subscription"("initialInvoiceId");
CREATE INDEX "Subscription_status_nextChargeAt_idx" ON "Subscription"("status", "nextChargeAt");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
