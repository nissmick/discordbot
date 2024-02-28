import { SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { AutocompleteHandler, CommandHandler } from "../typeing";

const Options = {
	emoji_name: "emoji_name",
	server_name: "server_name",
} as const;

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
			.setAutocomplete(true)
	)
	.addStringOption((o) =>
		o
			.setName(Options.server_name)
			.setNameLocalization("ja", "サーバー名")
			.setDescription("Server to prioritize only this time")
			.setDescriptionLocalization("ja", "今回だけ優先するサーバー")
			.setRequired(false)
	);
export const execute: CommandHandler = async (interaction, user) => {
	const solver = (await user).emojiResolver;
	const emoji_name = interaction.options
		.getString(Options.emoji_name, true)
		.replace(/<?:([a-zA-Z0-9_-~]*):(?:\d+>)?/, "$1");
	const server_name = interaction.options
		.getString(Options.server_name)
		?.replace(/(https?:)?\/\/([a-zA-Z0-9-.]+\.[a-zA-Z0-9-]+).*/, "$1");
	if (server_name) {
		interaction.reply(solver.get(emoji_name, [server_name])?.url || "エラー");
	} else {
		interaction.reply(solver.get(emoji_name)?.url || "エラー");
	}
};

export const autocomplete: AutocompleteHandler = (interaction, { emojiResolver }) => {
	const partialText = interaction.options.getString(Options.emoji_name, true);
	const result = emojiResolver.query([partialText]);
	const respond: { name: string; value: string }[] = [];
	result.forEach((emojis, key) => {
		emojis.forEach((item) => {
			respond.push({
				name: `${key} - ${item.category} - ${item.name}`,
				value: item.name,
			});
		});
	});
	interaction.respond(respond.slice(0, 25));
};
