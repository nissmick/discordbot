import { SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import config from "../config.json";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(config["gemini-api-key"]);
const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig: { maxOutputTokens: 2000 } });

const Options = {
	content: "content",
} as const;
export const command = new SlashCommandBuilder()
	.setName(Commands.askai)
	.setDescription("Gemini Proに質問する")
	.addStringOption((o) => o.setName(Options.content).setDescription("質問する内容").setRequired(true));
export const execute: CommandHandler = async (interaction) => {
	await interaction.deferReply(/*{ ephemeral: true }*/);
	const content = interaction.options.getString(Options.content, true);
	console.log("[ Gemini Pro ] 質問: " + content);
	try {
		const result = await model.generateContentStream([content]);
		interaction.editReply(
			"<a:loading:1186939837073326151> 出力中...\n AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。"
		);
		let text = "";
		for await (const chunk of result.stream) {
			text += chunk.text();
			interaction.editReply("<a:loading:1186939837073326151> 出力中...\n" + text);
		}
		console.log("[ Gemini Pro ] AIの解答:" + text);
		interaction.editReply(
			text +
				"\n\n ✅ 生成完了 AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。"
		);
	} catch (error) {
		if (error instanceof Error) {
			interaction.editReply("Failed: " + error.message);
		}
	}
};
