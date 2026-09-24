-- CreateTable
CREATE TABLE "HeatScript" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "heatNumber" INTEGER NOT NULL,
    "script" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "HeatNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "judgeId" INTEGER NOT NULL,
    "heatId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "HeatNote_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HeatNote_heatId_fkey" FOREIGN KEY ("heatId") REFERENCES "Heat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "HeatScript_heatNumber_key" ON "HeatScript"("heatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HeatNote_judgeId_heatId_key" ON "HeatNote"("judgeId", "heatId");
