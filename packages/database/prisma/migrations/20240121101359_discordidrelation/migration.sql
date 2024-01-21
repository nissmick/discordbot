/*
  Warnings:

  - Added the required column `new_authorUserId` to the `CollaborativeMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_userId` to the `DiscordAuth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_userId` to the `LoginBonus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_userId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
BEGIN;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorUserId" INTEGER NOT NULL,
    "new_authorUserId" BIGINT,
    CONSTRAINT "CollaborativeMessage_new_authorUserId_fkey" FOREIGN KEY ("new_authorUserId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollaborativeMessage" ("authorUserId", "channelId", "content", "guildId", "id", "messageId") SELECT "authorUserId", "channelId", "content", "guildId", "id", "messageId" FROM "CollaborativeMessage";
UPDATE "new_CollaborativeMessage"
SET "new_authorUserId" = (SELECT "discord_id" FROM "User" WHERE "User"."id" = "new_CollaborativeMessage"."authorUserId");
DROP TABLE "CollaborativeMessage";
ALTER TABLE "new_CollaborativeMessage" RENAME TO "CollaborativeMessage";
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "new_userId" BIGINT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "refreshToken", "userId") SELECT "accessToken", "expiresIn", "id", "refreshToken", "userId" FROM "DiscordAuth";
UPDATE "new_DiscordAuth"
SET "new_userId" = (SELECT "discord_id" FROM "User" WHERE "User"."id" = "new_DiscordAuth"."userId");
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_userId_key" ON "DiscordAuth"("userId");
CREATE UNIQUE INDEX "DiscordAuth_new_userId_key" ON "DiscordAuth"("new_userId");
CREATE TABLE "new_LoginBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "Dates" TEXT NOT NULL DEFAULT '',
    "LastLogin" DATETIME NOT NULL DEFAULT 0,
    "consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "new_userId" BIGINT,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "LoginBonus_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "userId") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count", "userId" FROM "LoginBonus";
UPDATE "new_LoginBonus"
SET "new_userId" = (SELECT "discord_id" FROM "User" WHERE "User"."id" = "new_LoginBonus"."userId");
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_new_userId_key" ON "LoginBonus"("new_userId");
CREATE UNIQUE INDEX "LoginBonus_userId_key" ON "LoginBonus"("userId");
CREATE TABLE "new_RefreshToken" (
    "discord_id" BIGINT NOT NULL,
    "expireAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "new_userId" BIGINT,
    CONSTRAINT "RefreshToken_new_userId_fkey" FOREIGN KEY ("new_userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefreshToken" ("discord_id", "expireAt", "token", "userId") SELECT "discord_id", "expireAt", "token", "userId" FROM "RefreshToken";
UPDATE "new_RefreshToken"
SET "new_userId" = (SELECT "discord_id" FROM "User" WHERE "User"."id" = "new_RefreshToken"."userId");
DROP TABLE "RefreshToken";
ALTER TABLE "new_RefreshToken" RENAME TO "RefreshToken";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

COMMIT;