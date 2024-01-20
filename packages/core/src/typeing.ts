import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import type { EmojiResolver } from "./emoji_store";
type UserData = {
	LoginBonus: {
		id: number;
		count: number;
		Dates: string;
		LastLogin: Date;
		consecutive_count: number;
		max_consecutive_count: number;
	};
	discord_username: string;
	id: number;
	discord_id: bigint;
	emoji_default_server: string;
	emojiResolver: EmojiResolver;
};
type CommandHandler = (interaction: ChatInputCommandInteraction, user: UserData) => void | Promise<void>;
type AutocompleteHandler = (interaction: AutocompleteInteraction, data: { emojiResolver: EmojiResolver }) => void;

export type { CommandHandler, AutocompleteHandler };
