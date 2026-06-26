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
