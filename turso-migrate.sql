-- CreateTable
CREATE TABLE "Studio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    CONSTRAINT "Instructor_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DanceType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Heat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "danceTypeId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 24,
    CONSTRAINT "Heat_danceTypeId_fkey" FOREIGN KEY ("danceTypeId") REFERENCES "DanceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    CONSTRAINT "Student_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeatEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeatEntry_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatEntry_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProShow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "partnership" TEXT NOT NULL,
    "dances" TEXT NOT NULL,
    "songTitle" TEXT,
    "artist" TEXT,
    "musicLink" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProShow_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentShow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "instructors" TEXT NOT NULL,
    "dances" TEXT NOT NULL,
    "songTitle" TEXT,
    "artist" TEXT,
    "musicLink" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentShow_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_StudentShowStudents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_StudentShowStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StudentShowStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentShow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Studio_name_key" ON "Studio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DanceType_name_key" ON "DanceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Heat_number_key" ON "Heat"("number");

-- CreateIndex
CREATE UNIQUE INDEX "HeatEntry_heatId_studentId_key" ON "HeatEntry"("heatId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentShowStudents_AB_unique" ON "_StudentShowStudents"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentShowStudents_B_index" ON "_StudentShowStudents"("B");
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
-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "amount" REAL NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'expense',
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    "leaderNumber" INTEGER,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Student_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("firstName", "id", "lastName", "role", "studioId") SELECT "firstName", "id", "lastName", "role", "studioId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Instructor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "studioId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Neither',
    "leaderNumber" INTEGER,
    CONSTRAINT "Instructor_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Instructor" ("id", "name", "studioId") SELECT "id", "name", "studioId" FROM "Instructor";
DROP TABLE "Instructor";
ALTER TABLE "new_Instructor" RENAME TO "Instructor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
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
-- CreateTable
CREATE TABLE "StudentEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    CONSTRAINT "StudentEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEvent_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentEvent_studentId_eventId_key" ON "StudentEvent"("studentId", "eventId");
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
