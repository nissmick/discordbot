/*
  Warnings:

  - You are about to drop the column `new_userId` on the `LoginBonus` table. All the data in the column will be lost.
  - You are about to drop the column `new_userId` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to alter the column `userId` on the `RefreshToken` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to drop the column `new_authorUserId` on the `CollaborativeMessage` table. All the data in the column will be lost.
  - You are about to drop the column `new_userId` on the `DiscordAuth` table. All the data in the column will be lost.
  - Added the required column `userId` to the `LoginBonus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorUserId` to the `CollaborativeMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DiscordAuth` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
BEGIN;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "Dates" TEXT NOT NULL DEFAULT '',
    "LastLogin" DATETIME NOT NULL DEFAULT 0,
    "consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "userId" BIGINT NOT NULL,
    CONSTRAINT "LoginBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoginBonus" ("Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count","userId") SELECT "Dates", "LastLogin", "consecutive_count", "count", "id", "max_consecutive_count","new_userId" FROM "LoginBonus";
DROP TABLE "LoginBonus";
ALTER TABLE "new_LoginBonus" RENAME TO "LoginBonus";
CREATE UNIQUE INDEX "LoginBonus_userId_key" ON "LoginBonus"("userId");
CREATE TABLE "new_RefreshToken" (
    "discord_id" BIGINT NOT NULL,
    "expireAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefreshToken" ("discord_id", "expireAt", "token", "userId") SELECT "discord_id", "expireAt", "token", "new_userId" FROM "RefreshToken";
DROP TABLE "RefreshToken";
ALTER TABLE "new_RefreshToken" RENAME TO "RefreshToken";
CREATE TABLE "new_CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorUserId" BIGINT NOT NULL,
    CONSTRAINT "CollaborativeMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollaborativeMessage" ("channelId", "content", "guildId", "id", "messageId","authorUserId") SELECT "channelId", "content", "guildId", "id", "messageId","new_authorUserId" FROM "CollaborativeMessage";
DROP TABLE "CollaborativeMessage";
ALTER TABLE "new_CollaborativeMessage" RENAME TO "CollaborativeMessage";
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "refreshToken","userId") SELECT "accessToken", "expiresIn", "id", "refreshToken","new_userId" FROM "DiscordAuth";
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_userId_key" ON "DiscordAuth"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
COMMIT;
