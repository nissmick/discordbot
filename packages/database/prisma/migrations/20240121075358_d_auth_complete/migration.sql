/*
  Warnings:

  - Made the column `userId` on table `DiscordAuth` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "refreshToken", "userId") SELECT "accessToken", "expiresIn", "id", "refreshToken", "userId" FROM "DiscordAuth";
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_userId_key" ON "DiscordAuth"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
