import {
	AttachmentBuilder,
	SlashCommandBuilder,
	type APIApplicationCommandOptionChoice,
	type Collection,
	type CommandInteraction,
	type Message,
} from "discord.js";
import { Commands } from "../enum";
import type { CommandHandler } from "../typeing";
import * as crypto from "node:crypto";
//import { prisma } from "../store";
const SubCommand = {
	message: {
		name: "message",
		options: {
			format: {
				name: "format",
				choices: [
					{
						name_localizations: {
							ja: "ユーザー名: 内容",
						},
						name: "username: content (basic)",
						value: "basic",
					},
					{
						name_localizations: {
							ja: "時間付き",
						},
						name: "with time",
						value: "with_time",
					},
					{
						name_localizations: {
							ja: "整形された",
						},
						name: "pretty",
						value: "pretty",
					},
					{
						name_localizations: {
							ja: "コンテンツだけ",
						},
						name: "content only",
						value: "content_only",
					},
					{
						name_localizations: {
							ja: "匿名か",
						},
						name: "anonymize",
						value: "anonymize",
					},
					{
						name: "JSON",
						value: "json",
					},
				] as const satisfies Readonly<APIApplicationCommandOptionChoice<string>[]>,
			},
			max: {
				name: "max",
			},
		},
	},
	settings: {
		name: "settings",
		options: {
			approval: {
				name: "approval",
			},
		},
	},
} as const satisfies {
	[x: string]: { name: string; options?: { [x: string]: { name: string; [x: string]: unknown } } };
};
type SubCommand = typeof SubCommand;
type Format = SubCommand["message"]["options"]["format"]["choices"][number]["value"];
export const command = new SlashCommandBuilder()
	.setName(Commands.export)
	.setDescription("exportするやつ")
	.addSubcommand((o) =>
		o
			.setName(SubCommand.message.name)
			.setDescription("複数のメッセージを書き出します")
			.addIntegerOption((o) =>
				o
					.setName(SubCommand.message.options.max.name)
					.setDescription("書き出す数")
					.setMinValue(1)
					.setMaxValue(100)
					.setRequired(true)
			)
			.addStringOption((o) =>
				o
					.setName(SubCommand.message.options.format.name)
					.setDescription("メッセージのスタイル 既定: basic")
					.setChoices(...SubCommand.message.options.format.choices)
			)
	);
export const execute: CommandHandler = async (interaction, user) => {
	switch (interaction.options.getSubcommand(true) as keyof SubCommand) {
		case "message": {
			await MessageCommandHandler(interaction, user);
			return;
		}
		case "settings": {
			await SettingCommandHandler(interaction, user);
			return;
		}
	}
};

const MessageCommandHandler: CommandHandler = async (interaction) => {
	const format = (interaction.options.getString(SubCommand.message.options.format.name, false) as Format) ?? "basic";
	const max = interaction.options.getInteger(SubCommand.message.options.max.name, true);
	if (!interaction.channel) {
		interaction.reply({
			content: "チャンネル以外では使用できません",
			ephemeral: true,
		});
		return;
	}
	const messages = (
		await interaction.channel.messages.fetch({
			limit: max,
		})
	).reverse();
	let text = "";
	if (format === "json") {
		formatJson(interaction, messages);
		return;
	}
	const solt = crypto.randomUUID();
	for (const [, message] of messages) {
		text += formatf(message, format, { solt }) + "\n";
	}
	const file = Buffer.from(text);
	interaction.reply({
		files: [
			new AttachmentBuilder(file, {
				name: "messages.txt",
			}),
		],
	});
};

function formatf(msg: Message, f: Format = "basic", { solt }: { solt: string }) {
	const attachment = msg.attachments;
	switch (f) {
		case "basic": {
			const formated_attatchments = attachment.reduce((ac, att) => `${ac} ${att.url}`, "");
			return (
				`${msg.author.tag}${msg.author.bot ? " [bot]" : ""}: ${msg.content}` +
				(attachment.size ? formated_attatchments : "")
			);
		}
		case "anonymize": {
			const formated_attatchments = attachment.reduce((ac, att) => `${ac} ${att.url}`, "");
			const hashed = md5(msg.author.id + solt).slice(0, 6);
			return (
				`${hashed}${msg.author.bot ? " [bot]" : ""}: ${msg.content}` +
				(attachment.size ? formated_attatchments : "")
			);
		}
		default: {
			return "[dummy data]";
		}
	}
}
function formatJson(interaction: CommandInteraction, messages: Collection<string, Message<boolean>>) {
	interaction.reply("ごめんね、jsonは未実装です");
	return;
	for (const [, message] of messages) {
		message;
	}
}

function md5(str: string) {
	const md5 = crypto.createHash("md5");
	md5.update(str);
	return md5.digest("hex");
}
const SettingCommandHandler: CommandHandler = (interaction) => {
	const approval = interaction.options.getBoolean(SubCommand.settings.options.approval.name);
	if (approval !== null) {
		return;
	}
};
