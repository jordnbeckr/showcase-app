/*
  Warnings:

  - You are about to drop the column `instructors` on the `StudentShow` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StudentStudioAccess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "studioId" INTEGER NOT NULL,
    CONSTRAINT "StudentStudioAccess_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentStudioAccess_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Judge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "JudgeFloorRange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "floorId" INTEGER NOT NULL,
    "heatFrom" INTEGER NOT NULL,
    "heatTo" INTEGER NOT NULL DEFAULT 9999,
    CONSTRAINT "JudgeFloorRange_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JudgeFloorRange_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeatFloorAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "floorId" INTEGER NOT NULL,
    CONSTRAINT "HeatFloorAssignment_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatFloorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatFloorAssignment_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JudgeFloor" (
    "judgeId" INTEGER NOT NULL,
    "floorId" INTEGER NOT NULL,

    PRIMARY KEY ("judgeId", "floorId"),
    CONSTRAINT "JudgeFloor_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JudgeFloor_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedbackCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ClosedScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "placement" TEXT NOT NULL,
    CONSTRAINT "ClosedScore_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClosedScore_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClosedScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpenThumb" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sentiment" TEXT NOT NULL,
    CONSTRAINT "OpenThumb_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenThumb_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenThumb_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenThumb_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedbackCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpenNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "OpenNote_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenNote_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompRound" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "round" TEXT NOT NULL DEFAULT 'final',
    "finalSize" INTEGER NOT NULL DEFAULT 6,
    "semiSize" INTEGER NOT NULL DEFAULT 7,
    CONSTRAINT "CompRound_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "place" INTEGER NOT NULL,
    CONSTRAINT "CompScore_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompScore_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemiMark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "called" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SemiMark_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SemiMark_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SemiMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_StudentShowInstructors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_StudentShowInstructors_A_fkey" FOREIGN KEY ("A") REFERENCES "Instructor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StudentShowInstructors_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentShow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isAmateur" BOOLEAN NOT NULL DEFAULT false,
    "isCompetitive" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Event" ("id", "name", "order") SELECT "id", "name", "order" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_Heat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "danceTypeId" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 24,
    "category" TEXT NOT NULL DEFAULT 'none',
    CONSTRAINT "Heat_danceTypeId_fkey" FOREIGN KEY ("danceTypeId") REFERENCES "DanceType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Heat" ("danceTypeId", "id", "maxCapacity", "number") SELECT "danceTypeId", "id", "maxCapacity", "number" FROM "Heat";
DROP TABLE "Heat";
ALTER TABLE "new_Heat" RENAME TO "Heat";
CREATE UNIQUE INDEX "Heat_number_key" ON "Heat"("number");
CREATE TABLE "new_HeatEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heatId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "partnerStudentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeatEntry_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatEntry_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "HeatEntry_partnerStudentId_fkey" FOREIGN KEY ("partnerStudentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HeatEntry" ("createdAt", "heatId", "id", "instructorId", "studentId") SELECT "createdAt", "heatId", "id", "instructorId", "studentId" FROM "HeatEntry";
DROP TABLE "HeatEntry";
ALTER TABLE "new_HeatEntry" RENAME TO "HeatEntry";
CREATE UNIQUE INDEX "HeatEntry_heatId_studentId_key" ON "HeatEntry"("heatId", "studentId");
CREATE TABLE "new_StudentEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "partnerStudentId" INTEGER,
    CONSTRAINT "StudentEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentEvent_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StudentEvent" ("eventId", "id", "instructorId", "studentId") SELECT "eventId", "id", "instructorId", "studentId" FROM "StudentEvent";
DROP TABLE "StudentEvent";
ALTER TABLE "new_StudentEvent" RENAME TO "StudentEvent";
CREATE UNIQUE INDEX "StudentEvent_studentId_eventId_key" ON "StudentEvent"("studentId", "eventId");
CREATE TABLE "new_StudentShow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studioId" INTEGER NOT NULL,
    "dances" TEXT NOT NULL,
    "songTitle" TEXT,
    "artist" TEXT,
    "musicLink" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentShow_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentShow" ("artist", "createdAt", "dances", "id", "musicLink", "notes", "order", "songTitle", "studioId") SELECT "artist", "createdAt", "dances", "id", "musicLink", "notes", "order", "songTitle", "studioId" FROM "StudentShow";
DROP TABLE "StudentShow";
ALTER TABLE "new_StudentShow" RENAME TO "StudentShow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StudentStudioAccess_studentId_studioId_key" ON "StudentStudioAccess"("studentId", "studioId");

-- CreateIndex
CREATE UNIQUE INDEX "Judge_name_key" ON "Judge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_label_key" ON "Floor"("label");

-- CreateIndex
CREATE UNIQUE INDEX "HeatFloorAssignment_heatId_studentId_key" ON "HeatFloorAssignment"("heatId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackCategory_name_key" ON "FeedbackCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedScore_judgeId_heatId_studentId_key" ON "ClosedScore"("judgeId", "heatId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenThumb_judgeId_heatId_studentId_categoryId_key" ON "OpenThumb"("judgeId", "heatId", "studentId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenNote_judgeId_heatId_studentId_key" ON "OpenNote"("judgeId", "heatId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CompRound_eventId_key" ON "CompRound"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CompScore_judgeId_eventId_studentId_key" ON "CompScore"("judgeId", "eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SemiMark_judgeId_eventId_studentId_key" ON "SemiMark"("judgeId", "eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentShowInstructors_AB_unique" ON "_StudentShowInstructors"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentShowInstructors_B_index" ON "_StudentShowInstructors"("B");
