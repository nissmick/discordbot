/*
  Warnings:

  - Made the column `new_userId` on table `RefreshToken` required. This step will fail if there are existing NULL values in that column.
  - Made the column `new_userId` on table `LoginBonus` required. This step will fail if there are existing NULL values in that column.
  - Made the column `new_authorUserId` on table `CollaborativeMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `new_userId` on table `DiscordAuth` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RefreshToken" (
    "discord_id" BIGINT NOT NULL,
    "expireAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "new_userId" BIGINT NOT NULL,
    CONSTRAINT "RefreshToken_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefreshToken" ("discord_id", "expireAt", "new_userId", "token", "userId") SELECT "discord_id", "expireAt", "new_userId", "token", "userId" FROM "RefreshToken";
DROP TABLE "RefreshToken";
ALTER TABLE "new_RefreshToken" RENAME TO "RefreshToken";
CREATE TABLE "new_LoginBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "Dates" TEXT NOT NULL DEFAULT '',
    "LastLogin" DATETIME NOT NULL DEFAULT 0,
    "consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "new_userId" BIGINT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "LoginBonus_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "new_userId", "userId") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "new_userId", "userId" FROM "LoginBonus";
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_new_userId_key" ON "LoginBonus"("new_userId");
CREATE UNIQUE INDEX "LoginBonus_userId_key" ON "LoginBonus"("userId");
CREATE TABLE "new_CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorUserId" INTEGER NOT NULL,
    "new_authorUserId" BIGINT NOT NULL,
    CONSTRAINT "CollaborativeMessage_new_authorUserId_fkey" FOREIGN KEY ("new_authorUserId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollaborativeMessage" ("authorUserId", "channelId", "content", "guildId", "id", "messageId", "new_authorUserId") SELECT "authorUserId", "channelId", "content", "guildId", "id", "messageId", "new_authorUserId" FROM "CollaborativeMessage";
DROP TABLE "CollaborativeMessage";
ALTER TABLE "new_CollaborativeMessage" RENAME TO "CollaborativeMessage";
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "new_userId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "new_userId", "refreshToken", "userId") SELECT "accessToken", "expiresIn", "id", "new_userId", "refreshToken", "userId" FROM "DiscordAuth";
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_userId_key" ON "DiscordAuth"("userId");
CREATE UNIQUE INDEX "DiscordAuth_new_userId_key" ON "DiscordAuth"("new_userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
