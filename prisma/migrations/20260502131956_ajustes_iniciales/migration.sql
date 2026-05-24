/*
  Warnings:

  - You are about to drop the column `applicationCode` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `arrivalDate` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `currentEmployer` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `maritalStatus` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `officePhone` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `passportNumber` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `purposeOfTrip` on the `VisaApplication` table. All the data in the column will be lost.
  - You are about to drop the column `stayDuration` on the `VisaApplication` table. All the data in the column will be lost.
  - The `status` column on the `VisaApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONSUL', 'CITIZEN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'ID_CARD', 'PHOTO', 'SUPPORTING_DOC');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- DropIndex
DROP INDEX "VisaApplication_applicationCode_key";

-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "applicationCode",
DROP COLUMN "arrivalDate",
DROP COLUMN "birthDate",
DROP COLUMN "currentEmployer",
DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "lastName",
DROP COLUMN "maritalStatus",
DROP COLUMN "nationality",
DROP COLUMN "officePhone",
DROP COLUMN "passportNumber",
DROP COLUMN "profession",
DROP COLUMN "purposeOfTrip",
DROP COLUMN "stayDuration",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ApplicationStatus";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT NOT NULL,
    "visaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "visaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
