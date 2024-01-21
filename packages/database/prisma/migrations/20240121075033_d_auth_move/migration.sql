/*
  Warnings:

  - You are about to drop the column `dAuthId` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `DiscordAuth` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    CONSTRAINT "DiscordAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscordAuth" ("accessToken", "expiresIn", "id", "refreshToken") SELECT "accessToken", "expiresIn", "id", "refreshToken" FROM "DiscordAuth";
UPDATE "new_DiscordAuth"
SET "userId" = (SELECT "id" FROM "User" WHERE "User"."dAuthId" = "new_DiscordAuth"."id");
DROP TABLE "DiscordAuth";
ALTER TABLE "new_DiscordAuth" RENAME TO "DiscordAuth";
CREATE UNIQUE INDEX "DiscordAuth_userId_key" ON "DiscordAuth"("userId");
CREATE TABLE "new_User" (
    "discord_id" BIGINT NOT NULL,
    "discord_username" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "icon_url" TEXT NOT NULL DEFAULT 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png',
    "emoji_default_server" TEXT NOT NULL DEFAULT 'misskey.io',
    "isBot" BOOLEAN NOT NULL
);
INSERT INTO "new_User" ("discord_id", "discord_username", "emoji_default_server", "icon_url", "id", "isBot") SELECT "discord_id", "discord_username", "emoji_default_server", "icon_url", "id", "isBot" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discord_id_key" ON "User"("discord_id");
CREATE UNIQUE INDEX "User_discord_username_key" ON "User"("discord_username");
CREATE INDEX "User_discord_id_discord_username_idx" ON "User"("discord_id", "discord_username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
