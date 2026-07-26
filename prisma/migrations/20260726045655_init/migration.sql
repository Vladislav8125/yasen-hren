-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Tariff" AS ENUM ('FREE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "CardFamily" AS ENUM ('LIGHT', 'SHADOW', 'LIMINAL', 'PATH');

-- CreateEnum
CREATE TYPE "LifeSphere" AS ENUM ('HEALTH', 'RELATIONS', 'BUSINESS', 'HARMONY');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('WEB', 'TELEGRAM', 'VK');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "tariff" "Tariff" NOT NULL DEFAULT 'FREE',
    "tariffExpiresAt" TIMESTAMP(3),
    "preferredChannel" "DeliveryChannel" NOT NULL DEFAULT 'WEB',
    "telegramChatId" TEXT,
    "vkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archetype" (
    "id" TEXT NOT NULL,
    "family" "CardFamily" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "property" TEXT,
    "archetypeType" TEXT,
    "essence" TEXT NOT NULL,
    "function" TEXT,
    "inLife" TEXT,
    "ritual" TEXT,
    "cardQuestion" TEXT,
    "clinicalFlag" TEXT,
    "branch" TEXT,
    "shadowSide" TEXT,
    "pathFunctions" TEXT,
    "pathResources" TEXT,
    "pathRituals" TEXT,
    "pathShadows" TEXT,
    "pathMotto" TEXT,
    "pathManifestations" TEXT,
    "extendedDescription" TEXT,
    "usageInstruction" TEXT,
    "lightAllyId" TEXT,
    "lightAllyName" TEXT,
    "imageUrl" TEXT,
    "spheres" "LifeSphere"[],

    CONSTRAINT "Archetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDraw" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "primaryArchetypeId" TEXT NOT NULL,
    "secondaryArchetypeId" TEXT,
    "sphereRequested" "LifeSphere",
    "channel" "DeliveryChannel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tariff" "Tariff" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "yookassaPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'REQUESTED',
    "periodMonth" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedById" TEXT NOT NULL,
    "moderatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "User_vkUserId_key" ON "User"("vkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Archetype_name_key" ON "Archetype"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDraw_userId_date_key" ON "DailyDraw"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_yookassaPaymentId_key" ON "Payment"("yookassaPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_userId_periodMonth_key" ON "Consultation"("userId", "periodMonth");

-- AddForeignKey
ALTER TABLE "Archetype" ADD CONSTRAINT "Archetype_lightAllyId_fkey" FOREIGN KEY ("lightAllyId") REFERENCES "Archetype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDraw" ADD CONSTRAINT "DailyDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDraw" ADD CONSTRAINT "DailyDraw_primaryArchetypeId_fkey" FOREIGN KEY ("primaryArchetypeId") REFERENCES "Archetype"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDraw" ADD CONSTRAINT "DailyDraw_secondaryArchetypeId_fkey" FOREIGN KEY ("secondaryArchetypeId") REFERENCES "Archetype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlossaryTerm" ADD CONSTRAINT "GlossaryTerm_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
