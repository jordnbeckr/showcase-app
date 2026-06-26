/*
  Warnings:

  - You are about to drop the column `eventId` on the `Heat` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "EventHeat" (
    "eventId" INTEGER NOT NULL,
    "heatId" INTEGER NOT NULL,

    PRIMARY KEY ("eventId", "heatId"),
    CONSTRAINT "EventHeat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventHeat_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Heat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "danceTypeId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 24,
    CONSTRAINT "Heat_danceTypeId_fkey" FOREIGN KEY ("danceTypeId") REFERENCES "DanceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Heat" ("danceTypeId", "id", "maxCapacity", "number") SELECT "danceTypeId", "id", "maxCapacity", "number" FROM "Heat";
DROP TABLE "Heat";
ALTER TABLE "new_Heat" RENAME TO "Heat";
CREATE UNIQUE INDEX "Heat_number_key" ON "Heat"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
