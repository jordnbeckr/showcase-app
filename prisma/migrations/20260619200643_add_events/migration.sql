-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Heat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "danceTypeId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 24,
    "eventId" INTEGER,
    CONSTRAINT "Heat_danceTypeId_fkey" FOREIGN KEY ("danceTypeId") REFERENCES "DanceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Heat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Heat" ("danceTypeId", "id", "maxCapacity", "number") SELECT "danceTypeId", "id", "maxCapacity", "number" FROM "Heat";
DROP TABLE "Heat";
ALTER TABLE "new_Heat" RENAME TO "Heat";
CREATE UNIQUE INDEX "Heat_number_key" ON "Heat"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
