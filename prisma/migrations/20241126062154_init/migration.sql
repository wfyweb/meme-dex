-- AlterTable
ALTER TABLE "DynamicData" ALTER COLUMN "distribed" DROP NOT NULL,
ALTER COLUMN "insider_rate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaticData" ALTER COLUMN "renounced_mint" DROP NOT NULL,
ALTER COLUMN "burn_status" DROP NOT NULL,
ALTER COLUMN "frozen" DROP NOT NULL;
