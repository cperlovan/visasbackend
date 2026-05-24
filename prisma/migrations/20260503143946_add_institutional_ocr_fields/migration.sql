-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'PENDING_FORM_FILL';

-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "economicResponsible" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "passportExpiryDate" TIMESTAMP(3),
ADD COLUMN     "passportIssueDate" TIMESTAMP(3),
ADD COLUMN     "passportType" TEXT;
