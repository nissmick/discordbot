/*
  Warnings:

  - Made the column `userId` on table `LoginBonus` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "Dates" TEXT NOT NULL DEFAULT '',
    "LastLogin" DATETIME NOT NULL DEFAULT 0,
    "consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "LoginBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "userId") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "userId" FROM "LoginBonus";
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_userId_key" ON "LoginBonus"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
