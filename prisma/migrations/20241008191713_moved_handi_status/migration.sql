/*
  Warnings:

  - You are about to drop the column `handiCatStatus` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "handiCatStatus";

-- AlterTable
ALTER TABLE "UserWallet" ADD COLUMN     "handiCatStatus" "HandiCatStatus" NOT NULL DEFAULT 'ACTIVE';
