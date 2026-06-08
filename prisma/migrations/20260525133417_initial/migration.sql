/*
  Warnings:

  - Added the required column `providerId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('HOLDER', 'DEPENDENT');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EXTERNAL_REVIEWER';

-- AlterEnum
ALTER TYPE "VisaType" ADD VALUE 'CORTESIA';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "familyRole" "FamilyRole" NOT NULL DEFAULT 'HOLDER';

-- CreateTable
CREATE TABLE "AuthProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaTypeConfig" (
    "id" TEXT NOT NULL,
    "visaType" "VisaType" NOT NULL,
    "name" TEXT NOT NULL,
    "arancelAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisaTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaRequirement" (
    "id" TEXT NOT NULL,
    "visaConfigId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,

    CONSTRAINT "VisaRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "visaConfigId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "roleRequired" "UserRole" NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_name_key" ON "AuthProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VisaTypeConfig_visaType_key" ON "VisaTypeConfig"("visaType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_visaConfigId_stepOrder_key" ON "WorkflowStep"("visaConfigId", "stepOrder");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AuthProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaRequirement" ADD CONSTRAINT "VisaRequirement_visaConfigId_fkey" FOREIGN KEY ("visaConfigId") REFERENCES "VisaTypeConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_visaConfigId_fkey" FOREIGN KEY ("visaConfigId") REFERENCES "VisaTypeConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
