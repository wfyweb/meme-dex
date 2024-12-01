-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "mnemonic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT,
    "type" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticData" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "open_timestamp" TIMESTAMP(3) NOT NULL,
    "renounced_mint" INTEGER NOT NULL,
    "renounced_freeze_account" INTEGER NOT NULL,
    "burn_status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicData" (
    "id" TEXT NOT NULL,
    "staticId" TEXT NOT NULL,
    "liquidity" DECIMAL(15,2) NOT NULL,
    "market_cap" DECIMAL(15,2) NOT NULL,
    "holder_count" INTEGER NOT NULL,
    "price" DECIMAL(25,18) NOT NULL,
    "swaps" INTEGER NOT NULL,
    "sells" INTEGER NOT NULL,
    "buys" INTEGER NOT NULL,
    "top_10_holder_rate" INTEGER NOT NULL,
    "renounced_mint" INTEGER NOT NULL,

    CONSTRAINT "DynamicData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_uniqueId_key" ON "Account"("uniqueId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_type_uniqueId_key" ON "Account"("userId", "type", "uniqueId");
