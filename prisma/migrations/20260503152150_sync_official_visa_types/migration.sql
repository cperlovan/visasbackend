/*
  Warnings:

  - The values [T,TR_N,TRL] on the enum `VisaType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VisaType_new" AS ENUM ('TURISTA', 'NEGOCIOS', 'PRO_V_90', 'TRL_ARTISTA', 'TRL_DEPORTISTA');
ALTER TABLE "VisaApplication" ALTER COLUMN "visaType" TYPE "VisaType_new" USING ("visaType"::text::"VisaType_new");
ALTER TYPE "VisaType" RENAME TO "VisaType_old";
ALTER TYPE "VisaType_new" RENAME TO "VisaType";
DROP TYPE "VisaType_old";
COMMIT;
