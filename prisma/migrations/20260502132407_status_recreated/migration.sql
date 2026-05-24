/*
  Warnings:

  - You are about to drop the column `visaId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `visaId` on the `Payment` table. All the data in the column will be lost.
  - The `status` column on the `VisaApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[applicationCode]` on the table `VisaApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_REVIEW', 'COMPLETED');

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "visaId",
ADD COLUMN     "visaApplicationId" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "visaId",
ADD COLUMN     "visaApplicationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT;

-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "applicationCode" TEXT,
ADD COLUMN     "arrivalDate" TIMESTAMP(3),
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "currentEmployer" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "officePhone" TEXT,
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "purposeOfTrip" TEXT,
ADD COLUMN     "stayDuration" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "VisaApplication_applicationCode_key" ON "VisaApplication"("applicationCode");
