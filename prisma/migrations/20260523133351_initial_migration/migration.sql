/*
  Warnings:

  - The values [PRO_V_90,TRL_ARTISTA,TRL_DEPORTISTA] on the enum `VisaType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `email` on the `VisaApplication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `VisaApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VisaType_new" AS ENUM ('TURISTA', 'NEGOCIOS', 'PRO_v_90', 'TLR_ARTISTA', 'TLR_DEPORTISTA');
ALTER TABLE "VisaApplication" ALTER COLUMN "visaType" TYPE "VisaType_new" USING ("visaType"::text::"VisaType_new");
ALTER TYPE "VisaType" RENAME TO "VisaType_old";
ALTER TYPE "VisaType_new" RENAME TO "VisaType";
DROP TYPE "VisaType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;

-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "email",
ADD COLUMN     "selfieUrl" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
