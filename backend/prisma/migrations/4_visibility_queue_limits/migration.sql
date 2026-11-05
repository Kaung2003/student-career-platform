-- CreateEnum
CREATE TYPE "CompanyActivityType" AS ENUM ('SEARCH', 'VIEW');

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "companyVisibleSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CompanyActivity" (
    "id" TEXT NOT NULL,
    "type" "CompanyActivityType" NOT NULL,
    "companyId" TEXT NOT NULL,
    "profileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitCounter" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitCounter_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "StudentProfile_companyVisibleSince_idx" ON "StudentProfile"("companyVisibleSince");

-- CreateIndex
CREATE INDEX "CompanyActivity_type_createdAt_idx" ON "CompanyActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyActivity_companyId_createdAt_idx" ON "CompanyActivity"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyActivity_profileId_idx" ON "CompanyActivity"("profileId");

-- CreateIndex
CREATE INDEX "EmailJob_failedAt_runAt_idx" ON "EmailJob"("failedAt", "runAt");

-- CreateIndex
CREATE INDEX "RateLimitCounter_resetAt_idx" ON "RateLimitCounter"("resetAt");

-- AddForeignKey
ALTER TABLE "CompanyActivity" ADD CONSTRAINT "CompanyActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyActivity" ADD CONSTRAINT "CompanyActivity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
