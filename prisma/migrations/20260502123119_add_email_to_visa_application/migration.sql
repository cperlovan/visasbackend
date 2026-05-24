/*
  Warnings:

  - Added the required column `email` to the `VisaApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "email" TEXT NOT NULL;
