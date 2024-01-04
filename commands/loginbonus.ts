import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../store";
import { Commands } from "../enum";
import { CommandHandler } from "../typeing";

export function calcLocaledDate(td: number, date: Date) {
	const t = date.valueOf();
	return (t / 1000 + 60 * 60 * td) / (60 * 60 * 24);
}

export const calcJST = calcLocaledDate.bind(null, 9);

export const command = new SlashCommandBuilder().setName(Commands.logincheck).setDescription("出席を確認");
export const execute: CommandHandler = async (interaction, user) => {
	const replied = await interaction.deferReply();
	const now = new Date();
	let LoginBonus = user.LoginBonus;
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
	console.log(LoginBonus);
	const lastLogin = Math.floor(calcJST(LoginBonus.LastLogin));
	const nowDate = Math.floor(calcJST(now));
	console.log(lastLogin, nowDate);
	const datediff = Math.floor(nowDate - lastLogin);
	console.log(datediff);
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
