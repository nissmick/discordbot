import {
	ActionRowBuilder,
	ButtonInteraction,
	Events,
	ModalBuilder,
	REST,
	Routes,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import type {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
	Message,
	ModalSubmitInteraction,
	TextBasedChannel,
} from "discord.js";
import config from "./config.json";
import { greeting, logincheck, ranking, zandaka, misskey_emoji, exec, emoji_search, askai, youyaku } from "./commands";
import { Channels, Commands } from "./enum";
import { client, prisma } from "./store";
import { EmojiResolver } from "./emoji_store";
import * as fs from "node:fs";
import { LogtextBuilder } from "./logtext_builder";
import { genAIHandler } from "./commands/askai";
const rest = new REST().setToken(config.token);

const commands = [
	greeting.command,
	logincheck.command,
	ranking.command,
	zandaka.command,
	misskey_emoji.command,
	exec.command,
	emoji_search.command,
	askai.command,
	youyaku.command,
];
const emojiResolvers: Map<bigint, EmojiResolver> = new Map();
client.on(Events.InteractionCreate, (interaction) => {
	if (interaction.isChatInputCommand()) commandHandler(interaction);
	if (interaction.isButton()) buttonHandler(interaction);
	if (interaction.isModalSubmit()) modalHandler(interaction);
	if (interaction.isAutocomplete()) autoCompleteHandler(interaction);
	// if (interaction.isButton()) buttonHandler(interaction);
	//	console.log(interaction);
});
async function autoCompleteHandler(interaction: AutocompleteInteraction<CacheType>) {
	switch (interaction.commandName) {
		case Commands.misskey_emoji:
			misskey_emoji.autocomplete(interaction, {
				emojiResolver: emojiResolvers.get(BigInt(interaction.user.id))!,
			});
			break;
	}
}

async function modalHandler(interaction: ModalSubmitInteraction) {
	const id = interaction.customId.slice("continue-".length);
	const prompts = await prisma.prompts.findUnique({
		where: {
			id: parseInt(id),
		},
		include: {
			content: true,
		},
	});
	if (!prompts) {
		await interaction.reply("!!データが見つかりませんでした");
		return;
	}
	const contents = prompts.content.map((item) => {
		return {
			role: item.isUser ? "user" : "model",
			parts: [
				{
					text: item.content,
				},
			],
		};
	});
	await genAIHandler(
		interaction,
		interaction.fields.getTextInputValue("content"),
		{
			contents: [
				...contents,
				{
					role: "user",
					parts: [{ text: interaction.fields.getTextInputValue("content") }],
				},
			],
		},
		prompts.id
	);
}

async function buttonHandler(interaction: ButtonInteraction) {
	if (interaction.customId.startsWith("continue-")) {
		const input = new TextInputBuilder()
			.setCustomId("content")
			.setLabel("追加で聞く内容")
			.setStyle(TextInputStyle.Paragraph);
		const modal = new ModalBuilder()
			.setTitle("追加で聞く内容")
			.setCustomId(interaction.customId)
			.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

		await interaction.showModal(modal);
	}
}
const editedStore: {
	[x: string]:
		| {
				replied: Message<boolean>;
				includesMention: string[];
		  }
		| undefined;
} = {};
client.on(Events.MessageCreate, async (message) => {
	if (message.inGuild()) logger(message, "create");
	if (message.channelId === Channels.automod_detector) {
		const data = Object.fromEntries(message.embeds[0].fields.map((item) => [item.name, item.value])) as {
			rule_name: string;
			channel_id: string;
			decision_id: string;
			keyword: string;
			keyword_matched_content: string;
		};
		const regex = new RegExp(data.keyword);
		const matched = data.keyword_matched_content.match(regex);
		console.log(matched?.[1]);
		await (client.channels.cache.get(data.channel_id) as TextBasedChannel).send({
			content: "Incognito Message: " + matched?.[1],
			allowedMentions: {
				parse: [],
			},
		});
		console.log("sended: " + matched?.[1]);
	}
});
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
	if (newMessage.author?.id === config.client_id) return;
	if (oldMessage.content && newMessage.content) {
		console.log("edit 検知 from: " + newMessage.author?.displayName);
		const oldMatched = [...oldMessage.content.matchAll(/<@(\d+)>/g)].map((e) => e[1]);
		const newMatched = [...newMessage.content.matchAll(/<@(\d+)>/g)].map((e) => e[1]);
		const diff = newMatched.filter((e) => !oldMatched.includes(e));
		const stored = editedStore[newMessage.id];
		console.log("diff: ", diff);
		console.log("includesMention: ", stored?.includesMention);
		if (diff.length) {
			if (stored) {
				const deletedmention = diff.filter((e) => !stored.includesMention.includes(e));
				if (deletedmention) {
					stored.replied.edit({
						content: `${stored.replied.content} \n ${deletedmention
							.map((e) => `<@${e}>`)
							.join(" ")}へのメンションは取り消されました`,
					});
				}
				console.log("削除されたメンション:" + deletedmention);
			}
			const replied = await newMessage.reply({
				content: `${diff.map((e) => `<@${e}>`).join(" ")} さん、呼ばれてますよ`,
			});
			editedStore[newMessage.id] = {
				replied,
				includesMention: diff,
			};
		}
	}
});

async function commandHandler(interaction: ChatInputCommandInteraction) {
	const userdata = (await prisma.user.findUnique({
		where: {
			discord_id: BigInt(interaction.user.id),
		},
		include: {
			LoginBonus: true,
		},
	}))!;
	const user = {
		...userdata,
		emojiResolver: emojiResolvers.get(userdata.discord_id)!,
	};
	const arg = [interaction, user] as const;
	switch (interaction.commandName) {
		case Commands.greeting:
			greeting.execute(...arg);
			break;
		case Commands.logincheck:
			logincheck.execute(...arg);
			break;
		case Commands.ranking:
			ranking.execute(...arg);
			break;
		case Commands.zandaka:
			zandaka.execute(...arg);
			break;
		case Commands.misskey_emoji:
			misskey_emoji.execute(...arg);
			break;
		case Commands.exec:
			exec.execute(...arg);
			break;
		case Commands.emoji_search:
			emoji_search.execute(...arg);
			break;
		case Commands.askai:
			askai.execute(...arg);
			break;
		case Commands.youyaku:
			youyaku.execute(...arg);
			break;
	}
}

client.once(Events.ClientReady, async (readyClient) => {
	await rest.put(Routes.applicationCommands(config.client_id), {
		body: commands,
	});
	// 初期処理
	const homeserver = client.guilds.cache.get(config.homeserver)!;
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	console.log(homeserver.name);
	// メンバーをfetchしてsqlに入れる
	console.log("Fetching Member...");
	const members = await homeserver.members.fetch();
	console.log("Processing Member...");
	for await (const [, member] of members) {
		// console.log(member.user.username);
		try {
			const userdata = await prisma.user.upsert({
				where: {
					discord_id: BigInt(member.user.id),
				},
				create: {
					discord_id: BigInt(member.user.id),
					discord_username: member.user.username + member.user.tag ? `#${member.user.tag}` : "",
					screen_name: member.displayName,
					LoginBonus: {
						create: {},
					},
					isBot: member.user.bot,
				},
				update: {
					screen_name: member.displayName,
					discord_username: member.user.tag,
					isBot: member.user.bot,
				},
			});
			const resolver = new EmojiResolver(userdata.emoji_default_server, "misskey.io", "misskey.04.si");
			await resolver.fetchAll();
			emojiResolvers.set(BigInt(member.user.id), resolver);
		} catch (error) {
			console.error(error);
			console.info(member.user.username);
		}
	}
	console.log("All Member Processed!");
});

console.log("Hello via Bun!");

client.login(config.token);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function logger(message: Message<true>, _type: "create" | "edit" | "delete") {
	const time = `${message.createdAt.toISOString()} <t:${message.createdAt.valueOf().toString().slice(0, -3)}>`;
	const author = `${message.author.tag}${message.author.bot ? " [bot]" : ""} <@${message.author.id}>`;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const guild = `${message.guildId === config.homeserver ? "" : message.guild.name}`;
	const channel = `${message.channel.name} <#${message.channelId}>`;
	const content = message.content;
	const logtext = new LogtextBuilder({ sanitize: true });
	logtext.setItem("time", time).setItem("author", author).setItem("content", content).setItem("channel", channel);
	log(logtext.toString());
}
export function log(text: string) {
	console.log(text);
	fs.appendFileSync("./log/log.txt", text + "\n");
}
