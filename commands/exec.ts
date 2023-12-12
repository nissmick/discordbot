import { SlashCommandBuilder } from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import config from "../config.json";
import { client } from "../store";
const enum Option {
	code = "code",
	show = "show",
}

const AsyncFunction = async function () {}.constructor as new (...args: string[]) => (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => Promise<unknown>;
export const command = new SlashCommandBuilder()
	.setName(Commands.exec)
	.setDescription("任意のコードの実行")
	.addStringOption((o) => o.setName(Option.code).setDescription("実行するコードの内容").setRequired(true))
	.addBooleanOption((o) => o.setName(Option.show).setDescription("実行結果を周りでも見れるようにするか"));
export const execute: CommandHandler = async (interaction) => {
	if (config.hosts.includes(interaction.user.id)) {
		const ephemeral = !(interaction.options.getBoolean(Option.show) ?? false);
		let code = interaction.options.getString(Option.code, true);
		if (!code.includes("return")) {
			code = "return " + code;
		}
		//作れ
		await interaction.deferReply({ ephemeral });
		try {
			////// @ts-expect-error 一回黙ってもらえるかな
			const result = await new AsyncFunction("client", "interaction", "channel", code)(
				client,
				interaction,
				interaction.channel
			);
			if (result === undefined) {
				await interaction.editReply("undefined");
				return;
			}
			if (result === null) {
				await interaction.editReply("null");
				return;
			}
			try {
				await interaction.editReply({
					content: "```js\n" + JSON.stringify(result).replaceAll("`", "\\`") + "```",
				});

				return;
			} catch {
				await interaction.editReply({
					content: "```js\n" + result.toString().replaceAll("`", "\\`") + "```",
				});
				return;
			}
		} catch (error) {
			if (error instanceof Error) {
				await interaction.editReply({
					content: "```js\n" + error.stack?.replaceAll("`", "\\`") + "```",
				});
				return;
			}
		}
	} else {
		interaction.reply({ content: "あなたは使用できません", ephemeral: true });
	}
};
