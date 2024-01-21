/*
  Warnings:

  - You are about to alter the column `B` on the `_collaborator` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new__collaborator" (
    "A" INTEGER NOT NULL,
    "B" BIGINT NOT NULL,
    CONSTRAINT "_collaborator_A_fkey" FOREIGN KEY ("A") REFERENCES "CollaborativeMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_collaborator_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("discord_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__collaborator" ("A", "B") SELECT "A", "B" FROM "_collaborator";
DROP TABLE "_collaborator";
ALTER TABLE "new__collaborator" RENAME TO "_collaborator";
CREATE UNIQUE INDEX "_collaborator_AB_unique" ON "_collaborator"("A", "B");
CREATE INDEX "_collaborator_B_index" ON "_collaborator"("B");
CREATE TABLE "new_User" (
    "discord_id" BIGINT NOT NULL PRIMARY KEY,
    "discord_username" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL DEFAULT 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png',
    "emoji_default_server" TEXT NOT NULL DEFAULT 'misskey.io',
    "isBot" BOOLEAN NOT NULL
);
INSERT INTO "new_User" ("discord_id", "discord_username", "emoji_default_server", "icon_url", "isBot") SELECT "discord_id", "discord_username", "emoji_default_server", "icon_url", "isBot" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_discord_username_key" ON "User"("discord_username");
CREATE INDEX "User_discord_id_discord_username_idx" ON "User"("discord_id", "discord_username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
