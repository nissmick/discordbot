/*
  Warnings:

  - You are about to drop the column `loginBonusId` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `LoginBonus` table without a default value. This is not possible if the table is not empty.

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
    "userId" INTEGER,
    CONSTRAINT "LoginBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count" FROM "LoginBonus";
UPDATE "new_LoginBonus"
SET "userId" = (SELECT "id" FROM "User" WHERE "User"."loginBonusId" = "new_LoginBonus"."id");
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_userId_key" ON "LoginBonus"("userId");
CREATE TABLE "new_User" (
    "discord_username" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discord_id" BIGINT NOT NULL,
    "icon_url" TEXT NOT NULL DEFAULT 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png',
    "emoji_default_server" TEXT NOT NULL DEFAULT 'misskey.io',
    "isBot" BOOLEAN NOT NULL,
    "dAuthId" INTEGER,
    CONSTRAINT "User_dAuthId_fkey" FOREIGN KEY ("dAuthId") REFERENCES "DiscordAuth" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("dAuthId", "discord_id", "discord_username", "emoji_default_server", "icon_url", "id", "isBot") SELECT "dAuthId", "discord_id", "discord_username", "emoji_default_server", "icon_url", "id", "isBot" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discord_username_key" ON "User"("discord_username");
CREATE UNIQUE INDEX "User_discord_id_key" ON "User"("discord_id");
CREATE UNIQUE INDEX "User_dAuthId_key" ON "User"("dAuthId");
CREATE INDEX "User_discord_id_discord_username_idx" ON "User"("discord_id", "discord_username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
