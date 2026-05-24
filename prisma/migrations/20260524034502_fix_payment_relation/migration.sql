/*
  Warnings:

  - You are about to drop the column `visaApplicationId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'COORDINATOR';
ALTER TYPE "UserRole" ADD VALUE 'LINE_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'DIRECTOR_GENERAL';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_visaApplicationId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "visaApplicationId";

-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "parentApplicationId" TEXT,
ADD COLUMN     "paymentId" TEXT;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_parentApplicationId_fkey" FOREIGN KEY ("parentApplicationId") REFERENCES "VisaApplication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
