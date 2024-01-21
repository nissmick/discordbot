/*
  Warnings:

  - You are about to drop the column `userId` on the `LoginBonus` table. All the data in the column will be lost.
  - You are about to drop the column `authorUserId` on the `CollaborativeMessage` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `DiscordAuth` table. All the data in the column will be lost.

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
    "new_userId" BIGINT NOT NULL,
    CONSTRAINT "LoginBonus_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "new_userId") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "new_userId" FROM "LoginBonus";
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_new_userId_key" ON "LoginBonus"("new_userId");
CREATE TABLE "new_CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "new_authorUserId" BIGINT NOT NULL,
    CONSTRAINT "CollaborativeMessage_new_authorUserId_fkey" FOREIGN KEY ("new_authorUserId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollaborativeMessage" ("channelId", "content", "guildId", "id", "messageId", "new_authorUserId") SELECT "channelId", "content", "guildId", "id", "messageId", "new_authorUserId" FROM "CollaborativeMessage";
DROP TABLE "CollaborativeMessage";
ALTER TABLE "new_CollaborativeMessage" RENAME TO "CollaborativeMessage";
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "new_userId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "new_userId", "refreshToken") SELECT "accessToken", "expiresIn", "id", "new_userId", "refreshToken" FROM "DiscordAuth";
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_new_userId_key" ON "DiscordAuth"("new_userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
