/*
  Warnings:

  - The values [PENDING,IN_REVIEW,COMPLETED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `gender` column on the `VisaApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `maritalStatus` column on the `VisaApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[gatewayToken]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `visaType` on the `VisaApplication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('T', 'TR_N', 'PRO_V_90', 'TRL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('DRAFT', 'VALIDATION', 'CORRECTION', 'PRE_APPROVAL', 'APPROVED', 'REJECTED');
ALTER TABLE "VisaApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VisaApplication" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "VisaApplication" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'SELFIE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "auditData" JSONB,
ADD COLUMN     "gatewayToken" TEXT,
ADD COLUMN     "paymentUrl" TEXT;

-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "visaType",
ADD COLUMN     "visaType" "VisaType" NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
DROP COLUMN "maritalStatus",
ADD COLUMN     "maritalStatus" "MaritalStatus",
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayToken_key" ON "Payment"("gatewayToken");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_visaApplicationId_fkey" FOREIGN KEY ("visaApplicationId") REFERENCES "VisaApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_visaApplicationId_fkey" FOREIGN KEY ("visaApplicationId") REFERENCES "VisaApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
