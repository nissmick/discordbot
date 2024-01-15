import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	GuildMember,
	type Interaction,
	type ModalActionRowComponentBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	Role,
	SlashCommandBuilder,
	type TextBasedChannel,
	TextInputBuilder,
	TextInputStyle,
	EmbedBuilder,
	ChatInputCommandInteraction,
} from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import { client, prisma } from "../store";
import { CollaborativeMessage, CollaborativeMessageEditablePermission, User } from "@prisma/client";

const collaborativePrefix = "collaborative-";
export const editPrefix = `${collaborativePrefix}edit-`;
export const selectPrefix = `${collaborativePrefix}select-`;

/** そのユーザーが選択しているメッセージを保管する */
const selected: Map<
	string,
	CollaborativeMessage & { author: User } & { editable: CollaborativeMessageEditablePermission[] } & {
		collaborator: User[];
	}
> = new Map();

const SubCommand = {
	create: {
		name: "create",
		options: {
			editable: "editable",
		},
	},
	add_editable: {
		name: "add_editable",
		options: {
			editable: "editable",
		},
	},
	inspect: {
		name: "inspect",
	},
} as const;

export const command = new SlashCommandBuilder()
	.setName(Commands.collaborative_message)
	.setDescription("共同編集できるメッセージを生成する")
	.addSubcommand((o) =>
		o
			.setName(SubCommand.create.name)
			.setDescription("編集可能なメッセージを新規作成する")
			.addMentionableOption((o) =>
				o.setName(SubCommand.create.options.editable).setDescription("編集できるユーザー・ロール")
			)
	)
	.addSubcommand((o) =>
		o
			.setName(SubCommand.add_editable.name)
			.setDescription("現在選択している共同選択可能メッセージに編集可能なユーザーを増やします")
			.addMentionableOption((o) =>
				o.setName(SubCommand.add_editable.options.editable).setDescription("編集できるユーザー・ロール")
			)
	)
	.addSubcommand((o) =>
		o.setName(SubCommand.inspect.name).setDescription("選択している共同編集可能メッセージの詳細な情報を取得する")
	);
export const execute: CommandHandler = async (interaction) => {
	const commandName = interaction.options.getSubcommand(true) as keyof typeof SubCommand;
	switch (commandName) {
		case "create":
			await createHandler(interaction);
			break;
		case "add_editable":
			await addEditableHandler(interaction);
			break;
		case "inspect":
			await inspectCommandHandler(interaction);
			break;
	}
	return;
};

async function createHandler(interaction: ChatInputCommandInteraction) {
	const editable = interaction.options.getMentionable(SubCommand.create.options.editable, false);
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
			author: {
				connect: {
					discord_id: BigInt(interaction.user.id),
				},
			},
		},
	});
	const continuebutton = new ButtonBuilder()
		.setCustomId(`${editPrefix}${created.id}`)
		.setLabel("編集する")
		.setStyle(ButtonStyle.Secondary);
	const inspectButton = new ButtonBuilder()
		.setCustomId(`${selectPrefix}${created.id}`)
		.setLabel("select")
		.setStyle(ButtonStyle.Secondary);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(continuebutton).addComponents(inspectButton);

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
		.setCustomId(`${editPrefix}${created.id}`)
		.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

	await interaction.showModal(modal);
	return;
}

async function addEditableHandler(interaction: ChatInputCommandInteraction) {
	const editable = interaction.options.getMentionable(SubCommand.add_editable.options.editable, true);
	const message = selected.get(interaction.user.id);
	if (!message) {
		interaction.reply({
			ephemeral: true,
			content: "あなたはメッセージを選択していません。\n対象のメッセージのselectボタンを押して選択してください",
		});
		return;
	}
	if (!(message.author.discord_id === BigInt(interaction.user.id))) {
		await interaction.reply({
			ephemeral: true,
			content:
				"あなたはこのメッセージに対して編集者を追加できません。以下のような理由が考えられます: \n\
				* メッセージの作成者ではない - このコマンドでメッセージの編集者を追加できるのは、メッセージを作成した人のみです。",
		});
		return;
	}
	let permitted: { isRole: boolean; permitted: string };
	if (editable instanceof Role) {
		permitted = {
			isRole: true,
			permitted: editable.id,
		};
	} else if (editable instanceof GuildMember) {
		permitted = {
			isRole: false,
			permitted: editable.id,
		};
	} else {
		throw new Error("なんかやばいわ、RoleでもGuildMemberでもないのが飛び込んできたわ、やべえ");
	}
	try {
		await prisma.collaborativeMessageEditablePermission.create({
			data: {
				...permitted,
				CollaborativeMessage: {
					connect: {
						id: message.id,
					},
				},
			},
		});
	} catch (error) {
		console.error(error);
		interaction.reply("なんか失敗しました。てへぺろ");
		return;
	}

	await interaction.reply({
		content: `[collaborative-${message.id}](https://discord.com/channels/${message.guildId}/${message.channelId}/${
			message.messageId
		})に、${
			permitted.isRole ? `<@&${permitted.permitted}>` : `<@!${permitted.permitted}>`
		}への編集権限を与えました`,
		allowedMentions: {
			parse: [],
		},
		flags: ["SuppressEmbeds"],
	});
}

export const modalSubmitHandler = async (interaction: ModalSubmitInteraction) => {
	if (!interaction.inGuild()) return;
	const id = interaction.customId.slice(editPrefix.length);
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
	const isEditable = checkPermitted(interaction, column);
	if (!isEditable) {
		await interaction.reply({ ephemeral: true, content: "あなたは編集権限を所有していません" });
	}
	await message.edit({
		content: content,
		allowedMentions: {
			parse: [],
		},
	});

	await prisma.collaborativeMessage.update({
		where: {
			id: parseInt(id),
		},
		data: {
			content: content,
			collaborator: {
				connect: {
					discord_id: BigInt(interaction.user.id),
				},
			},
		},
	});

	await interaction.reply({
		content: "Success!",
		ephemeral: true,
	});

	return;
};

export const editHandler = async (interaction: ButtonInteraction) => {
	const id = interaction.customId.slice(editPrefix.length);
	if (!interaction.inGuild()) return;
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
	const isEditable = checkPermitted(interaction, column);

	if (!isEditable) {
		interaction.reply({
			ephemeral: true,
			content: "あなたは編集者に追加されていません",
		});
	}
	const input = new TextInputBuilder()
		.setCustomId("content")
		.setLabel("メッセージの内容")
		.setStyle(TextInputStyle.Paragraph)
		.setValue(column.content);
	const modal = new ModalBuilder()
		.setTitle("メッセージの内容")
		.setCustomId(interaction.customId)
		.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));

	await interaction.showModal(modal);
};

export const selectButtonHandler = async (interaction: ButtonInteraction) => {
	const id = parseInt(interaction.customId.slice(selectPrefix.length));
	const column = await prisma.collaborativeMessage.findUnique({
		where: {
			id,
		},
		include: {
			collaborator: true,
			editable: true,
			_count: true,
			author: true,
		},
	});
	if (!column) {
		await interaction.reply("DBが破損してるかも");
		return;
	}
	interaction.reply({
		ephemeral: true,
		content: "選択しました",
	});
	selected.set(interaction.user.id, column);
};

async function inspectCommandHandler(interaction: ChatInputCommandInteraction) {
	const column = selected.get(interaction.user.id);
	if (!column) {
		interaction.reply({
			ephemeral: true,
			content: "メッセージが選択されていません。選択したいメッセージのselectボタンを押すことで選択できます",
		});
		return;
	}
	const embed = new EmbedBuilder()
		.setTitle(`collaborative-${column.id}`)
		.setAuthor({
			name: column.author.discord_username + "によるメッセージ",
			iconURL: column.author.iconUrl,
			url: `https://discord.com/users/${column.author.discord_id}`,
		})
		.setURL(`https://discord.com/channels/${column.guildId}/${column.channelId}/${column.messageId}`)
		.setDescription("このメッセージの詳細")
		.addFields({
			name: "編集者",
			value: column.collaborator.map((user) => `<@${user.discord_id}>`).join("\n"),
			inline: true,
		})
		.addFields({
			name: "編集可能",
			value: column.editable
				.map((editable) => (editable.isRole ? `<@&${editable.permitted}>` : `<@${editable.permitted}>`))
				.join("\n"),
			inline: true,
		});
	await interaction.reply({ embeds: [embed] });
}

function checkPermitted(
	interaction: Interaction<"cached" | "raw">,
	column: { editable: CollaborativeMessageEditablePermission[] }
) {
	let isEditable = false;
	for (const row of column.editable) {
		if (row.isRole) {
			if (interaction.member instanceof GuildMember) {
				if (interaction.member.roles.cache.has(row.permitted)) {
					isEditable = true;
					break;
				}
			} else {
				const isPermitted = interaction.member.roles.some((roleId) => roleId === row.permitted);
				if (isPermitted) {
					isEditable = true;
					break;
				}
			}
		} else {
			if (interaction.user.id === row.permitted) {
				isEditable = true;
				break;
			}
		}
	}
	return isEditable;
}
