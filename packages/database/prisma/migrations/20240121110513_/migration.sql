-- DropIndex
DROP INDEX "User_discord_id_discord_username_idx";

-- CreateIndex
CREATE INDEX "User_discord_username_idx" ON "User"("discord_username");
