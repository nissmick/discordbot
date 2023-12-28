import {
	type Message,
	SlashCommandBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	CommandInteraction,
	ModalSubmitInteraction,
} from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import { log } from "..";
import { prisma, geminiProModel } from "../store";

const Options = {
	content: "content",
} as const;
export const command = new SlashCommandBuilder()
	.setName(Commands.askai)
	.setDescription("Gemini Proに質問する")
	.addStringOption((o) => o.setName(Options.content).setDescription("質問する内容").setRequired(true))
	.setDMPermission(false);
export const execute: CommandHandler = async (interaction) => {
	const content = interaction.options.getString(Options.content, true);
	genAIHandler(interaction, content, content);
};

function byteLengthOf(s: string) {
	return Buffer.byteLength(s);
}

export async function genAIHandler(
	interaction: CommandInteraction | ModalSubmitInteraction,
	contentText: string,
	content: Parameters<typeof geminiProModel.generateContentStream>[0],
	parentPromptId?: number
) {
	const replied = await interaction.deferReply(/*{ ephemeral: true }*/);
	log("[ Gemini Pro ] 質問: " + contentText);
	let fulltext = "質問: " + contentText + "\n\n";
	let output = "";
	const texts: { text: string; replied: Message<boolean> }[] = [];
	try {
		const result = await geminiProModel.generateContentStream(content);
		interaction.editReply({
			content:
				"<a:loading:1186939837073326151> 出力中...\n AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
			allowedMentions: {
				parse: [],
			},
		});
		for await (const chunk of result.stream) {
			output += chunk.text();
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
						replied: await (index === 1 ? await replied.fetch() : texts[index - 1].replied).reply({
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
		let prompts: { id: number };
		if (parentPromptId) {
			prompts = { id: parentPromptId };
		} else {
			prompts = await prisma.prompts.create({
				data: {
					authorId: BigInt(interaction.user.id),
				},
			});
		}
		await prisma.prompt.create({
			data: {
				promptsId: prompts.id,
				content: contentText,
				isUser: true,
			},
		});
		await prisma.prompt.create({
			data: {
				promptsId: prompts.id,
				content: output,
				isUser: false,
			},
		});
		const continuebutton = new ButtonBuilder()
			.setCustomId(`continue-${prompts.id}`)
			.setLabel("続けて質問する")
			.setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continuebutton);
		if (fulltext.length > 1800) {
			const last = texts.at(-1)!;
			last.replied.edit({
				content:
					last.text +
					"\n\n ✅ 生成完了 AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
				allowedMentions: {
					parse: [],
				},
				components: [row],
			});
		} else {
			interaction.editReply({
				content:
					fulltext +
					"\n\n ✅ 生成完了 AIの解答は不正確な情報（人物に関する情報など）を表示することがあるため、生成された回答を再確認するようにしてください。",
				allowedMentions: {
					parse: [],
				},
				components: [row],
			});
		}
	} catch (error) {
		if (error instanceof Error) {
			interaction.editReply(fulltext + "\n\nFailed: " + error.message);
			console.error(error);
		}
	}
}
