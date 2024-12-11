/*
  Warnings:

  - A unique constraint covering the columns `[referredBy]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referredBy` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referredBy` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "referredBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "referredBy" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_referredBy_key" ON "User"("referredBy");
