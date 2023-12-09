import { SlashCommandBuilder } from "discord.js";
import { Commands } from "./enum";
import type { CommandHandler } from "./typeing";

const enum Options {
	emoji_name = "emoji_name",
	server_name = "server_name",
}

export const command = new SlashCommandBuilder()
	.setName(Commands.misskey_emoji)
	.setDescription("Misskeyから絵文字情報を取得して返す")
	.addStringOption((o) =>
		o
			.setName(Options.emoji_name)
			.setNameLocalization("ja", "絵文字の名前")
			.setDescription("emojis name")
			.setDescriptionLocalization("ja", "取得する絵文字の名前")
			.setRequired(true)
	);
/*.addStringOption((o) =>
		o
			.setName(Options.server_name)
			.setNameLocalization("ja", "サーバー名")
			.setDescription("Server name to get emoji Default: misskey.io")
			.setDescriptionLocalization("ja", "絵文字を持ってくるサーバー名 既定: misskey.io")
			.setRequired(false)
	);*/
export const execute: CommandHandler = (interaction, user) => {
	const emoji_name = interaction.options.getString(Options.emoji_name, true);
	interaction.reply(user.emojiResolver.get(emoji_name)?.url || "エラー");
};
