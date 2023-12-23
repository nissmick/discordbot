import { type Message, SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import config from "../config.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "..";
const genAI = new GoogleGenerativeAI(config["gemini-api-key"]);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const Options = {
	content: "content",
} as const;
export const command = new SlashCommandBuilder()
	.setName(Commands.askai)
	.setDescription("Gemini Proに質問する")
	.addStringOption((o) => o.setName(Options.content).setDescription("質問する内容").setRequired(true))
	.setDMPermission(false);
export const execute: CommandHandler = async (interaction) => {
	const replied = await interaction.deferReply(/*{ ephemeral: true }*/);
	const content = interaction.options.getString(Options.content, true);
	log("[ Gemini Pro ] 質問: " + content);
	let fulltext = "質問: " + content + "\n\n";
	const texts: { text: string; replied: Message<boolean> }[] = [];
	try {
		const result = await model.generateContentStream([content]);
		interaction.editReply({
			content:
				"<a:loading:1186939837073326151> 出力中...\n AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
			allowedMentions: {
				parse: [],
			},
		});
		for await (const chunk of result.stream) {
			fulltext += chunk.text();
			const index = Math.floor(fulltext.length / 1800);
			const column = texts.at(index);
			console.log("長さ: " + fulltext.length + "\nバイト数:" + byteLengthOf(fulltext));
			if (fulltext.length > 1800) {
				if (column === undefined) {
					console.log("分割した");
					await interaction.editReply({
						content: fulltext.slice(0, 1800),
						allowedMentions: {
							parse: [],
						},
					});
					console.log(index);
					const text = fulltext.slice(index * 1800);
					texts[index] = {
						text,
						replied: await (
							await replied.fetch()
						).reply({
							content: "<a:loading:1186939837073326151> 出力中...\n" + text,
							allowedMentions: {
								parse: [],
							},
						}),
					};
				} else {
					const text = fulltext.slice(index * 1800);
					column.replied.edit({
						content: "<a:loading:1186939837073326151> 出力中...\n" + text,
						allowedMentions: {
							parse: [],
						},
					});
					column.text = text;
				}
			} else {
				await interaction
					.editReply({
						content: "<a:loading:1186939837073326151> 出力中...\n" + fulltext,
						allowedMentions: {
							parse: [],
						},
					})
					.catch((error: unknown) => {
						throw error;
					});
				console.log(fulltext);
			}
		}
		log("[ Gemini Pro ] AIの解答:" + fulltext);
		if (fulltext.length > 1800) {
			const last = texts.at(-1)!;
			last.replied.edit({
				content:
					last.text +
					"\n\n ✅ 生成完了 AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
				allowedMentions: {
					parse: [],
				},
			});
		} else {
			interaction.editReply({
				content:
					fulltext +
					"\n\n ✅ 生成完了 AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
				allowedMentions: {
					parse: [],
				},
			});
		}
	} catch (error) {
		if (error instanceof Error) {
			interaction.editReply(fulltext + "\n\nFailed: " + error.message);
			console.error(error);
		}
	}
};

function byteLengthOf(s: string) {
	return Buffer.byteLength(s);
}
