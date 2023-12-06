import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "./store";
import { Commands } from "./enum";

export const command = new SlashCommandBuilder().setName(Commands.logincheck).setDescription("出席を確認");
export const execute = async (interaction: ChatInputCommandInteraction) => {
	const replied = await interaction.reply("処理中...");
	const now = new Date();
	const user = await prisma.user.findUnique({
		where: { discord_id: BigInt(interaction.user.id) },
		include: {
			LoginBonus: true,
		},
	});
	let LoginBonus = user!.LoginBonus;
	if (!LoginBonus) {
		LoginBonus = (await prisma.user
			.update({
				where: {
					discord_id: BigInt(interaction.user.id),
				},
				data: {
					LoginBonus: {
						create: {},
					},
				},
			})
			.LoginBonus())!;
	}
	const datediff = now.getDate() - LoginBonus.LastLogin!.getDate();
	let consecutive_count: number;
	let max_consecutive_count: number;

	if (datediff === 0) {
		await interaction.editReply("今日はもうログイン済みです");
		const msg = await replied.fetch();
		await msg.react("❌");
		return;
	} else if (datediff === 1) {
		consecutive_count = LoginBonus.consecutive_count + 1;
	} else {
		consecutive_count = 1;
	}

	if (consecutive_count > LoginBonus.max_consecutive_count) {
		max_consecutive_count = consecutive_count;
	} else {
		max_consecutive_count = LoginBonus.max_consecutive_count;
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
					max_consecutive_count,
				},
			},
		},
		include: {
			LoginBonus: true,
		},
	});
	const embed = new EmbedBuilder()
		.setDescription("✅ 確認に成功しました！")
		.setFields(
			{
				name: "確認日数",
				value: result.LoginBonus!.count.toString() + "日" || "計測不可",
				inline: false,
			},
			{
				name: "連続ログイン日数",
				value: result.LoginBonus!.consecutive_count.toString() + "日" || "計測不可",
				inline: false,
			}
		)
		.setAuthor({
			name: "出席確認",
		});
	await interaction.editReply({ embeds: [embed], content: "" });
	const msg = await replied.fetch();
	await msg.react("✅");
};
/*
 */
