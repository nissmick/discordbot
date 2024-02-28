import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { Buffer } from "node:buffer";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
const Options = {
	query: "query",
} as const;
const Ansi = { red: "[1;3;31m", reset: "[0m" } as const;
export const command = new SlashCommandBuilder()
	.setName(Commands.emoji_search)
	.setDescription("絵文字を検索する")
	.addStringOption((o) => o.setName(Options.query).setDescription("検索のクエリ").setRequired(true));
export const execute: CommandHandler = async (interaction, puser) => {
	const user = await puser;
	const query = interaction.options.getString(Options.query, true);
	const regexMeta = new RegExp(
		"[" +
			"[]{}()*+?^-.\\"
				.split("")
				.map((i) => "\\" + i)
				.join("") +
			"]"
	);
	let regex: RegExp;
	try {
		regex = new RegExp(
			"^" +
				query
					.replace(regexMeta, "\\$1")
					.split(" ")
					.map((item) => "(?=.*" + item + ")")
					.join("") +
				".*$",
			"g"
		);
	} catch (e) {
		interaction.reply({
			content: "RegExp Error...",
			ephemeral: true,
		});
		return;
	}
	await interaction.deferReply();

	const resultRegExp = new RegExp(
		"(" +
			query
				.replace(regexMeta, "\\$1")
				.split(" ")
				.map((item) => "(" + item + ")")
				.join("|") +
			")",
		"g"
	);
	const emojis = await user.emojiResolver.query(regex);
	const showText: string[] = [];
	for (const [key, value] of emojis) {
		showText.push(`----${key}----`);
		value.forEach((emoji) =>
			showText.push(
				`name: ${emoji.name.replace(resultRegExp, `${Ansi.red}$1${Ansi.reset}`)} aliases: [${emoji.aliases.join(
					", "
				)}] category: ${emoji.category}`
			)
		);
	}
	await interaction.editReply({
		files: [new AttachmentBuilder(Buffer.from(showText.join("\n")), { name: "result.ansi" })],
	});
};
