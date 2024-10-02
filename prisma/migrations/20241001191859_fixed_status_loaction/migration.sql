/*
  Warnings:

  - You are about to drop the column `handiCatStatus` on the `UserWallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handiCatStatus" "HandiCatStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "UserWallet" DROP COLUMN "handiCatStatus";
