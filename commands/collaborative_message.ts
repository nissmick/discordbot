import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	GuildMember,
	ModalBuilder,
	ModalSubmitInteraction,
	Role,
	SlashCommandBuilder,
	TextBasedChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import { client, prisma } from "../store";

const Options = {
	editable: "editable",
} as const;

export const command = new SlashCommandBuilder()
	.setName(Commands.collaborative_message)
	.setDescription("共同編集できるメッセージを生成する")
	.addMentionableOption((o) => o.setName(Options.editable).setDescription("編集できるユーザー・ロール"));
export const execute: CommandHandler = async (interaction) => {
	console.log("start");
	const editable = interaction.options.getMentionable(Options.editable, false);
	if (!interaction.inGuild()) return;
	if (!interaction.channel) {
		await interaction.reply({
			content: "チャンネルが存在しませんでした",
		});
		return;
	}
	console.log("message send");
	const sended = await interaction.channel.send({
		content: "<a:loading:1186939837073326151> Processing...",
	});
	console.log("sended");
	const permitted: { isRole: boolean; permitted: string }[] = [];
	permitted.push({
		isRole: false,
		permitted: interaction.user.id,
	});
	if (editable !== null) {
		if (editable instanceof Role) {
			permitted.push({
				isRole: true,
				permitted: editable.id,
			});
		} else if (editable instanceof GuildMember) {
			permitted.push({
				isRole: false,
				permitted: editable.id,
			});
		}
	}
	console.log("permission setted");
	const created = await prisma.collaborativeMessage.create({
		data: {
			content: "",
			messageId: sended.id,
			channelId: sended.channel.id,
			guildId: sended.guild.id,
			editable: {
				create: permitted,
			},
		},
	});
	console.log("column created");
	const continuebutton = new ButtonBuilder()
		.setCustomId(`collaborative-${created.id}`)
		.setLabel("編集する")
		.setStyle(ButtonStyle.Secondary);
	console.log("button builded");
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continuebutton);
	console.log("button seted");

	await sended.edit({
		content: "<a:loading:1186939837073326151> Processing...",
		components: [row],
	});
	console.log("message edited");
	const input = new TextInputBuilder()
		.setCustomId("content")
		.setLabel("メッセージの内容")
		.setStyle(TextInputStyle.Paragraph);
	const modal = new ModalBuilder()
		.setTitle("メッセージの内容")
		.setCustomId(`collaborative-${created.id}`)
		.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
	console.log("modal builded");

	await interaction.showModal(modal);

	console.log("modal showed");
	return;
};

export const modalSubmitHandler = async (interaction: ModalSubmitInteraction) => {
	console.log("start");
	if (!interaction.inGuild()) return;
	console.log("inGuild");
	const id = interaction.customId.slice("collaborative-".length);
	console.log("sliced id");
	const content = interaction.fields.getTextInputValue("content");
	console.log("content parsed");
	const column = await prisma.collaborativeMessage.findUnique({
		where: {
			id: parseInt(id),
		},
		include: {
			editable: true,
		},
	});
	console.log("column fetched");

	if (!column) {
		await interaction.reply("エラー: テーブルが破損しています");
		return;
	}
	console.log("column found");

	const guild = client.guilds.cache.get(column.guildId)!;
	console.log("guild parsed");
	const channel = guild.channels.cache.get(column.channelId);
	console.log("channel parsed");
	if (!channel) {
		throw new Error("fatal");
	}
	console.log("channel found");
	const message = (channel as TextBasedChannel).messages.cache.get(column.messageId);
	console.log("message parsed");

	if (!message) {
		await interaction.reply("メッセージが存在しません");
		return;
	}
	console.log("message found");
	//let isEditable = false;
	for (const row of column.editable) {
		console.log(row); /*
		if (row.isRole) {
			console.log((interaction.member.roles as GuildMemberRoleManager).cache.entries());
		} else {
			console.log(row.permitted === interaction.user.id);
		}*/
	}
	console.log("row checked");
	await message.edit({
		content: content,
		allowedMentions: {
			parse: [],
		},
	});
	console.log("message edited");
	await interaction.reply({
		content: "Success!",
		ephemeral: true,
	});
	console.log("end");
	return;
};
