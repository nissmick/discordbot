import { SlashCommandBuilder } from "discord.js";
import { Commands } from "./enum";
import type { CommandHandler } from "./typeing";

export const command = new SlashCommandBuilder().setName(Commands.greeting).setDescription("挨拶");
export const execute: CommandHandler = (interaction) => {
	interaction.reply({
		content: "Hello",
	});
};
