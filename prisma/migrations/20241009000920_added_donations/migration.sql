/*
  Warnings:

  - You are about to drop the column `purchasedCode` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "purchasedCode",
ADD COLUMN     "hasDonated" BOOLEAN NOT NULL DEFAULT false;
