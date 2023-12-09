import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import config from "./config.json";
import * as greeting from "./greeting";
import * as logincheck from "./loginbonus";
import * as ranking from "./ranking";
import * as zandaka from "./zandaka";
import { PrismaClient } from "@prisma/client";
import { Commands } from "./enum";
const prisma = new PrismaClient();
// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
	],
});
const rest = new REST().setToken(config.token);
const commands = [greeting.command, logincheck.command, ranking.command, zandaka.command];

client.on(Events.InteractionCreate, (interaction) => {
	if (interaction.isChatInputCommand()) commandHandler(interaction);
	// if (interaction.isButton()) buttonHandler(interaction);
	//	console.log(interaction);
});
const editedStore: {
	[x: string]:
		| {
				replied: Message<boolean>;
				includesMention: string[];
		  }
		| undefined;
} = {};

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

function commandHandler(interaction: ChatInputCommandInteraction) {
	switch (interaction.commandName) {
		case Commands.greeting:
			greeting.execute(interaction);
			break;
		case Commands.logincheck:
			logincheck.execute(interaction);
			break;
		case Commands.ranking:
			ranking.execute(interaction);
			break;
		case Commands.zandaka:
			zandaka.execute(interaction);
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
			await prisma.user.upsert({
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
				},
				update: {
					screen_name: member.displayName,
				},
			});
		} catch (error) {
			console.error(error);
			console.info(member.user.username);
		}
	}
	console.log("All Member Processed!");
});

console.log("Hello via Bun!");

client.login(config.token);
