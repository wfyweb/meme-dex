/*
  Warnings:

  - You are about to drop the column `renounced_mint` on the `DynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `top_10_holder_rate` on the `DynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `renounced_freeze_account` on the `StaticData` table. All the data in the column will be lost.
  - Added the required column `distribed` to the `DynamicData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insider_rate` to the `DynamicData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `volume` to the `DynamicData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frozen` to the `StaticData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DynamicData" DROP COLUMN "renounced_mint",
DROP COLUMN "top_10_holder_rate",
ADD COLUMN     "distribed" INTEGER NOT NULL,
ADD COLUMN     "insider_rate" INTEGER NOT NULL,
ADD COLUMN     "volume" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StaticData" DROP COLUMN "renounced_freeze_account",
ADD COLUMN     "frozen" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "DynamicData" ADD CONSTRAINT "DynamicData_staticId_fkey" FOREIGN KEY ("staticId") REFERENCES "StaticData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
