import {
	ActionRowBuilder,
	GuildMember,
	GuildMemberRoleManager,
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
	const editable = interaction.options.getMentionable(Options.editable, false);
	if (!interaction.inGuild()) return;
	if (!interaction.channel) {
		interaction.reply({
			content: "チャンネルが存在しませんでした",
			ephemeral: true,
		});
		return;
	}

	const sended = await interaction.channel.send({
		content: "<a:loading:1186939837073326151> Processing...",
	});

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
	const input = new TextInputBuilder()
		.setCustomId("content")
		.setLabel("メッセージの内容")
		.setStyle(TextInputStyle.Paragraph);
	const modal = new ModalBuilder()
		.setTitle("メッセージの内容")
		.setCustomId(`collaborative-${created.id}`)
		.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
	await interaction.showModal(modal);
	interaction.reply({
		content: "created!",
		ephemeral: true,
	});
};

export const modalHandler = async (interaction: ModalSubmitInteraction) => {
	interaction.reply("はろー");
	if (!interaction.inGuild()) return;
	await interaction.deferReply({ ephemeral: true });
	const id = interaction.customId.slice("collaborative-".length);
	const content = interaction.fields.getTextInputValue("content");

	const column = await prisma.collaborativeMessage.findUnique({
		where: {
			id: parseInt(id),
		},
		include: {
			editable: true,
		},
	});
	if (!column) {
		await interaction.followUp("エラー: テーブルが破損しています");
		return;
	}
	const guild = client.guilds.cache.get(column.guildId);
	if (!guild) {
		console.log("ターゲットのメッセージが送られたサーバーにBotがいない、もしくはサーバーが存在しません。");
		/*
		await interaction.followUp(
			"ターゲットのメッセージが送られたサーバーにBotがいない、もしくはサーバーが存在しません。"
		);*/
		return;
	}
	const channel = guild.channels.cache.get(column.channelId);
	if (!channel) {
		await interaction.followUp(
			"ターゲットのメッセージが送られたチャンネルにBotが接続する権限がない、もしくはチャンネルが存在しません。"
		);
		return;
	}
	const message = (channel as TextBasedChannel).messages.cache.get(column.messageId);
	if (!message) {
		await interaction.followUp("メッセージが存在しません");
		return;
	}
	//let isEditable = false;
	for (const row of column.editable) {
		if (row.isRole) {
			console.log((interaction.member.roles as GuildMemberRoleManager).cache.entries());
		}
	}
	await message.edit({
		content,
	});
	interaction.followUp({
		content: "Success!",
	});
};
