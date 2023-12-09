import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { JSDOM } from "jsdom";
import { Commands } from "./enum";
import { CommandHandler } from "./typeing";
export const command = new SlashCommandBuilder().setName(Commands.zandaka).setDescription("ぽちくんの残高を開示します");
export const execute: CommandHandler = async (interaction) => {
	const replied = await interaction.reply("取得中...");
	const res = await fetch("https://www.ic-kururu.jp/point/index.php", {
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: "id0=111&id1=1201&id2=1260&id3=5858&action=send&mode=send",
		method: "POST",
	});
	const text = await res.text();
	const dom = JSDOM.fragment(text);
	const meisai = dom.querySelectorAll("div.meisai > dl")!;
	const zandaka = meisai[1].querySelector("dd")!;
	const point = meisai[2].querySelector("dd")!;
	const thisMonthUsege = meisai[3].querySelector("dd")!;
	const thisMonthExpire = meisai[4].querySelector("dd")!;
	const nextMonthExpire = meisai[5].querySelector("dd")!;
	const embed = new EmbedBuilder()
		.setTitle("ぽちさんのKURURU残高")
		// innerHTML,inline:trueを使っている理由は型がめんどいから
		.addFields({ name: "残高", value: zandaka.innerHTML, inline: true })
		.addFields({ name: "ポイント", value: point.innerHTML, inline: true })
		.addFields({ name: "今月利用分仮ポイント", value: thisMonthUsege.innerHTML, inline: true })
		.addFields({ name: "今月末失効予定ポイント", value: thisMonthExpire.innerHTML, inline: true })
		.addFields({ name: "来月末失効予定ポイント", value: nextMonthExpire.innerHTML, inline: true });
	await interaction.editReply({ content: "", embeds: [embed] });
	const msg = await replied.fetch();
	await msg.react("✅");
};
