import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder().setName("greeting").setDescription("挨拶");
export const execute = (interaction: ChatInputCommandInteraction) =>
	interaction.reply({
		content: "Hello",
	});
