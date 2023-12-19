import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { Buffer } from "node:buffer"
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
	const query = interaction.options.getString(Options.query, true);
	const regexMeta = new RegExp("[" + "[]{}()*+?^-.\\".split("").map(i => "\\" + i).join("") + "]");

	try {
		new RegExp(
			query
				.replace(regexMeta, "\\$&")
				.split(" ")
				.map((item) => "(" + item + ")")
				.join(".*?"),
			"g"
		);
	} catch (e) {
		return interaction.reply({
			content: "RegExp Error...",
			ephemeral: true
		});
	}
	await interaction.deferReply();

	const regex = new RegExp(
		"^" + query
			.replace(regexMeta, "\\$1")
			.split(" ")
			.map((item) => "(?=.*" + item + ")")
			.join("") + ".*$",
		"g"
	);
	const resultRegExp = new RegExp(
		"(" + query
			.replace(regexMeta, "\\$1")
			.split(" ")
			.map((item) => "(" + item + ")")
			.join("|") + ")",
		"g"
	);
	console.log(regex);
	const emojis = user.emojiResolver.query(regex);
	const showText: string[] = [];
	for (const [key, value] of emojis) {
		showText.push(`----${key}----`);
		value.forEach((emoji) =>
			showText.push(
				`name: ${emoji.name.replace(resultRegExp, "[1;3;31m$&[0m")} aliases: [${emoji.aliases
					.join(", ")
					.replaceAll("_", "_")}] category: ${emoji.category}`
			)
		);
	}
	console.log(emojis);
	console.log(showText);
	interaction.editReply({
		files: [
			new AttachmentBuilder(Buffer.from(showText.join("\n")), { name: "result.ansi" })
		]
	});
	console.log(regex);

};
