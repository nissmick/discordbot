-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    CONSTRAINT "Channel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorUserId" BIGINT NOT NULL,
    CONSTRAINT "CollaborativeMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CollaborativeMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CollaborativeMessage" ("authorUserId", "channelId", "content", "guildId", "id", "messageId") SELECT "authorUserId", "channelId", "content", "guildId", "id", "messageId" FROM "CollaborativeMessage";
DROP TABLE "CollaborativeMessage";
ALTER TABLE "new_CollaborativeMessage" RENAME TO "CollaborativeMessage";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
