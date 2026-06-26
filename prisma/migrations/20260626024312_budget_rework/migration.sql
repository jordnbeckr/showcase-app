/*
  Warnings:

  - You are about to drop the column `amount` on the `BudgetItem` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BudgetItem` table. All the data in the column will be lost.
  - You are about to drop the column `itemType` on the `BudgetItem` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `BudgetItem` table. All the data in the column will be lost.
  - Added the required column `unitCost` to the `BudgetItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ShowcaseSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryFee" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StudioBudget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "attendees" INTEGER NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StudioBudget_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_BudgetItem" ("category", "id", "name", "order") SELECT "category", "id", "name", "order" FROM "BudgetItem";
DROP TABLE "BudgetItem";
ALTER TABLE "new_BudgetItem" RENAME TO "BudgetItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StudioBudget_studioId_key" ON "StudioBudget"("studioId");
