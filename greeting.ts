import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Commands } from "./enum";

export const command = new SlashCommandBuilder().setName(Commands.greeting).setDescription("挨拶");
export const execute = (interaction: ChatInputCommandInteraction) => {
	interaction.reply({
		content: "Hello",
	});
};
