import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { prisma } from "./store";

export const command = new SlashCommandBuilder().setName("logincheck").setDescription("出席を確認");
export const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.reply("処理中...");
	const now = new Date();
	const user = await prisma.user.findUnique({
		where: { discord_id: BigInt(interaction.user.id) },
		include: {
			LoginBonus: true,
		},
	});
	const LoginBonus = user!.LoginBonus!;
	const datediff = now.getDate() - LoginBonus.LastLogin!.getDate();
	let consecutive_count: number;
	if (datediff === 0) {
		await interaction.editReply("今日はもうログイン済みです");
		return;
	} else if (datediff === 1) {
		consecutive_count = LoginBonus.consecutive_count + 1;
	} else {
		consecutive_count = 1;
	}

	const result = await prisma.user.update({
		where: {
			discord_id: BigInt(interaction.user.id),
		},
		data: {
			LoginBonus: {
				update: {
					Dates: LoginBonus.Dates + "," + now.toISOString(),
					count: LoginBonus.count + 1,
					LastLogin: now,
					consecutive_count,
				},
			},
		},
		include: {
			LoginBonus: true,
		},
	});
	await interaction.editReply({
		embeds: [
			{
				description: "✅ 確認に成功しました！",
				fields: [
					{
						name: "確認日数",
						value: result.LoginBonus!.count.toString() + "日" || "計測不可",
						inline: false,
					},
					{
						name: "連続ログイン日数",
						value: result.LoginBonus!.consecutive_count.toString() + "日" || "計測不可",
						inline: false,
					},
				],
				author: {
					name: "出席確認",
				},
			},
		],
	});
};
/*
 */
