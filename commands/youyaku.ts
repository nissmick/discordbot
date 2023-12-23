import { type Message, SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import config from "../config.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "..";
const genAI = new GoogleGenerativeAI(config["gemini-api-key"]);
const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig: { maxOutputTokens: 2000 } });

const Options = {
	count: "count",
} as const;
export const command = new SlashCommandBuilder()
	.setName(Commands.youyaku)
	.setDescription("チャットログを要約するtyattoroguwoyouyakusuru")
	.addNumberOption((o) =>
		o
			.setName(Options.count)
			.setDescription("要約するメッセージ数(ここから数えて)")
			.setRequired(true)
			.setMaxValue(1)
			.setMaxValue(100)
	)
	.setDMPermission(false);
export const execute: CommandHandler = async (interaction) => {
	const replied = await interaction.deferReply(/*{ ephemeral: true }*/);
	const count = interaction.options.getNumber(Options.count, true);
	const messages = await interaction.channel!.messages.fetch({
		limit: count,
	});
	const promptBody = messages.map((message) => {
		return `${message.author.displayName}: ${message.content || "[内容無し]"}`;
	});
	let fulltext = "";
	const texts: { text: string; replied: Message<boolean> }[] = [];
	try {
		const result = await model.generateContentStream(
			`${promptBody.join("\n")}

			これらはチャットでのメッセージです。ここで行われていた議論の大まかなテーマ、意見の数々、方向性などをまとめて。不適切な表現は含まないように`
		);
		interaction.editReply({
			content: "<a:loading:1186939837073326151> 出力中...",
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
		log("[ Gemini Pro 要約 ] AIの出力:" + fulltext);
		if (fulltext.length > 1800) {
			const last = texts.at(-1)!;
			last.replied.edit({
				content: last.text + "\n\n ✅ 生成完了",
				allowedMentions: {
					parse: [],
				},
			});
		} else {
			interaction.editReply({
				content: fulltext + "\n\n ✅ 生成完了",
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
