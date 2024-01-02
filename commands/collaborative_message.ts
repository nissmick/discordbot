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
	const editable = interaction.options.getMentionable(Options.editable, false);
	if (!interaction.inGuild()) return;
	if (!interaction.channel) {
		await interaction.reply({
			content: "チャンネルが存在しませんでした",
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
	const continuebutton = new ButtonBuilder()
		.setCustomId(`collaborative-${created.id}`)
		.setLabel("編集する")
		.setStyle(ButtonStyle.Secondary);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continuebutton);

	await sended.edit({
		content: "<a:loading:1186939837073326151> Processing...",
		components: [row],
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
	return;
};

export const modalSubmitHandler = async (interaction: ModalSubmitInteraction) => {
	if (!interaction.inGuild()) return;
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
		await interaction.reply("エラー: テーブルが破損しています");
		return;
	}

	const guild = client.guilds.cache.get(column.guildId)!;
	const channel = guild.channels.cache.get(column.channelId);
	if (!channel) {
		await interaction.reply("エラー: チャンネルが存在しない、またはBotの権限不足によりアクセスできません");
	}
	const message = (channel as TextBasedChannel).messages.cache.get(column.messageId);
	console.log("message parsed");

	if (!message) {
		await interaction.reply("メッセージが存在しません");
		return;
	}

	//let isEditable = false;
	for (const row of column.editable) {
		console.log(row); /*
		if (row.isRole) {
			console.log((interaction.member.roles as GuildMemberRoleManager).cache.entries());
		} else {
			console.log(row.permitted === interaction.user.id);
		}*/
	}

	await message.edit({
		content: content,
		allowedMentions: {
			parse: [],
		},
	});

	await interaction.reply({
		content: "Success!",
		ephemeral: true,
	});

	return;
};
