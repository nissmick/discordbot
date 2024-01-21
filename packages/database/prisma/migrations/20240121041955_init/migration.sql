-- CreateTable
CREATE TABLE "User" (
    "discord_username" TEXT NOT NULL,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discord_id" BIGINT NOT NULL,
    "icon_url" TEXT NOT NULL DEFAULT 'https://discord.com/assets/5d6a5e9d7d77ac29116e.png',
    "loginBonusId" INTEGER NOT NULL,
    "emoji_default_server" TEXT NOT NULL DEFAULT 'misskey.io',
    "isBot" BOOLEAN NOT NULL,
    "dAuthId" INTEGER,
    CONSTRAINT "User_loginBonusId_fkey" FOREIGN KEY ("loginBonusId") REFERENCES "LoginBonus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_dAuthId_fkey" FOREIGN KEY ("dAuthId") REFERENCES "DiscordAuth" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "discord_id" BIGINT NOT NULL,
    "expireAt" DATETIME NOT NULL,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscordAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "LoginBonus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "Dates" TEXT NOT NULL DEFAULT '',
    "LastLogin" DATETIME NOT NULL DEFAULT 0,
    "consecutive_count" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_count" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Prompts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorId" BIGINT NOT NULL,
    CONSTRAINT "Prompts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("discord_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promptsId" INTEGER NOT NULL,
    "isUser" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "Prompt_promptsId_fkey" FOREIGN KEY ("promptsId") REFERENCES "Prompts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborativeMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "authorUserId" INTEGER NOT NULL,
    CONSTRAINT "CollaborativeMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborativeMessageEditablePermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collaborativeMessageId" INTEGER NOT NULL,
    "isRole" BOOLEAN NOT NULL,
    "permitted" TEXT NOT NULL,
    CONSTRAINT "CollaborativeMessageEditablePermission_collaborativeMessageId_fkey" FOREIGN KEY ("collaborativeMessageId") REFERENCES "CollaborativeMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_collaborator" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_collaborator_A_fkey" FOREIGN KEY ("A") REFERENCES "CollaborativeMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_collaborator_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discord_username_key" ON "User"("discord_username");

-- CreateIndex
CREATE UNIQUE INDEX "User_discord_id_key" ON "User"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_loginBonusId_key" ON "User"("loginBonusId");

-- CreateIndex
CREATE UNIQUE INDEX "User_dAuthId_key" ON "User"("dAuthId");

-- CreateIndex
CREATE INDEX "User_discord_id_discord_username_idx" ON "User"("discord_id", "discord_username");

-- CreateIndex
CREATE UNIQUE INDEX "_collaborator_AB_unique" ON "_collaborator"("A", "B");

-- CreateIndex
CREATE INDEX "_collaborator_B_index" ON "_collaborator"("B");
