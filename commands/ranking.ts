import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../store";
import { Commands } from "../enum";
import { CommandHandler } from "../typeing";

export const command = new SlashCommandBuilder()
	.setName(Commands.ranking)
	.setDescription("ランキングを確認")
	.addNumberOption((c) => {
		return c
			.setName("min_login")
			.setDescription("最低ログイン数")
			.setNameLocalization("ja", "最低ログイン数")
			.setRequired(true)
			.setMinValue(1);
	});
export const execute: CommandHandler = async (interaction) => {
	const replied = await interaction.reply({ content: "処理中..." /*, ephemeral: true*/ });
	const min_login = interaction.options.getNumber("min_login")!;
	const embed = new EmbedBuilder().setTitle("Ranking");
	const matcheduser = await prisma.user.findMany({
		where: {
			LoginBonus: {
				count: {
					gte: min_login,
				},
			},
		},
		include: {
			LoginBonus: true,
		},
	});
	let result_text = "";

	const max = Math.max(...matcheduser.map((item) => item.LoginBonus!.count));
	let beforecount = max;
	let index = 1;
	matcheduser
		.toSorted((a, b) => {
			return b.LoginBonus!.count - a.LoginBonus!.count;
		})
		.forEach((user, i) => {
			const { count } = user.LoginBonus!;
			if (beforecount !== count) {
				beforecount = count;
				index = i + 1;
			}
			console.log(user.discord_username + ` count: ${count}`);
			if (count === max) {
				result_text += `**#${index} |<@${user.discord_id}> ${count}日** \n`;
			} else {
				result_text += `#${index} |<@${user.discord_id}> ${count}日 \n`;
			}
		});
	if (result_text) {
		embed.setDescription(result_text);
		await interaction.editReply({ embeds: [embed], content: "" });
		const msg = await replied.fetch();
		await msg.react("✅");
	} else {
		embed.setDescription("該当するユーザーは一人もいませんでした。");
		await interaction.editReply({ embeds: [embed], content: "" });
		const msg = await replied.fetch();
		await msg.react("❌");
	}
};
