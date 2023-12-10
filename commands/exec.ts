import { SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import config from "../config.json";
import { client } from "../store";
const enum Option {
	code = "code",
	show = "show",
}
export const command = new SlashCommandBuilder()
	.setName(Commands.exec)
	.setDescription("任意のコードの実行")
	.addStringOption((o) => o.setName(Option.code).setDescription("実行するコードの内容").setRequired(true))
	.addBooleanOption((o) => o.setName(Option.show).setDescription("実行結果を周りでも見れるようにするか"));
export const execute: CommandHandler = async (interaction) => {
	if (config.hosts.includes(interaction.user.id)) {
		const ephemeral = interaction.options.getBoolean(Option.show) || true;
		let code = interaction.options.getString(Option.code, true);
		if (!code.includes("return")) {
			code = "return " + code;
		}
		//作れ
		await interaction.reply({ content: "Processing...", ephemeral });
		try {
			const result = new Function("client", "interaction", "channel", code)(
				client,
				interaction,
				interaction.channel
			);
			try {
				await interaction.editReply({
					content: "```js\n" + JSON.stringify(result).replaceAll("`", "\\`") + "```",
				});
			} catch {
				await interaction.editReply({ content: "```js\n" + result.toString().replaceAll("`", "\\`") + "```" });
			}
		} catch (error) {
			if (error instanceof Error) {
				await interaction.editReply({ content: "```js\n" + error.stack?.replaceAll("`", "\\`") + "```" });
			}
		}
	} else {
		interaction.reply({ content: "あなたは使用できません", ephemeral: true });
	}
};
