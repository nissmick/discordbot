import type { ChatInputCommandInteraction } from "discord.js";
import type { EmojiResolver } from "./emoji_store";
type UserData = {
	LoginBonus: {
		id: number;
		count: number;
		Dates: string;
		LastLogin: Date;
		consecutive_count: number;
		max_consecutive_count: number;
	} | null;
	discord_username: string;
	id: number;
	discord_id: bigint;
	screen_name: string;
	emoji_default_server: string;
	emojiResolver: EmojiResolver;
};
type CommandHandler = (interaction: ChatInputCommandInteraction, user: UserData) => void;

export type { CommandHandler };
