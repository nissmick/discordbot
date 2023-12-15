import { SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
const Options = {
	query: "query",
} as const;

export const command = new SlashCommandBuilder()
	.setName(Commands.emoji_search)
	.setDescription("絵文字を検索する")
	.addStringOption((o) => o.setName(Options.query).setDescription("検索のクエリ").setRequired(true));
export const execute: CommandHandler = async (interaction, user) => {
	await interaction.deferReply();
	const query = interaction.options.getString(Options.query, true);
	const regex = new RegExp(
		query
			.split(" ")
			.map((item) => "(" + item + ")")
			.join(".*?"),
		"g"
	);
	console.log(regex);
	const emojis = user.emojiResolver.query(regex);
	const showText: string[] = [];
	for (const [key, value] of emojis) {
		showText.push(`----${key}----`);
		value.forEach((emoji) =>
			showText.push(
				`name: ${emoji.name.replace(regex, "**$1**").replaceAll("_", "\\_")} aliases: [${emoji.aliases
					.join(", ")
					.replaceAll("_", "\\_")}] category: ${emoji.category}`
			)
		);
	}
	console.log(emojis);
	console.log(showText);
	interaction.editReply({
		content: /*"```\n" + */ showText.join("\n").slice(0, 1990) /* + "```",*/,
	});
};
