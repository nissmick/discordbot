import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../store";
import { Commands } from "../enum";
import { CommandHandler } from "../typeing";
import { calcJST } from "./loginbonus";

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
	const now = new Date();
	const replied = await interaction.deferReply({
		/*, ephemeral: true*/
	});
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
		orderBy: {
			LoginBonus: {
				count: "desc",
			},
		},
	});
	let result_text = "";

	const max = Math.max(...matcheduser.map((item) => item.LoginBonus!.count));
	let beforecount = max;
	let index = 1;
	matcheduser.forEach((user, i) => {
		const lastLogin = Math.floor(calcJST(user.LoginBonus!.LastLogin));
		const nowDate = Math.floor(calcJST(now));
		const datediff = Math.floor(nowDate - lastLogin);

		const { count } = user.LoginBonus!;
		if (beforecount !== count) {
			beforecount = count;
			index = i + 1;
		}
		console.log(user.discord_username + ` count: ${count}`);
		if (count === max) {
			result_text += `**#${index} |<@${user.discord_id}> ${count}日** `;
		} else {
			result_text += `#${index} |<@${user.discord_id}> ${count}日 `;
		}
		result_text += datediff === 0 ? "`today`" : datediff === 1 ? "`yesterday`" : `\`${datediff} days ago\``;
		result_text += "\n";
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
