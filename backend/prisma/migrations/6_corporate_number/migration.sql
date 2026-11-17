-- AlterTable
ALTER TABLE "Company" ADD COLUMN "corporateNumber" TEXT,
ADD COLUMN "checks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Company_corporateNumber_key" ON "Company"("corporateNumber");
