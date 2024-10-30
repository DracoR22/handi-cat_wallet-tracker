/*
  Warnings:

  - You are about to drop the column `ValidUntil` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `UserPromotion` table. All the data in the column will be lost.
  - Added the required column `isStackable` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "ValidUntil",
DROP COLUMN "validFrom",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isStackable" BOOLEAN NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "UserPromotion" DROP COLUMN "isActive";
