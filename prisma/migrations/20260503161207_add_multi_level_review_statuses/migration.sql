/*
  Warnings:

  - The values [PRE_APPROVAL] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('DRAFT', 'PENDING_FORM_FILL', 'VALIDATION', 'CORRECTION', 'PENDING_COORDINATOR_REVIEW', 'PENDING_LINE_MANAGER_REVIEW', 'PENDING_DIRECTOR_GENERAL_REVIEW', 'APPROVED', 'REJECTED');
ALTER TABLE "VisaApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VisaApplication" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "VisaApplication" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
