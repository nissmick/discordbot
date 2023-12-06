import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import config from "./config.json";
import * as greeting from "./greeting";
import * as logincheck from "./loginbonus";
import * as ranking from "./ranking";
import * as zandaka from "./zandaka";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
const rest = new REST().setToken(config.token);
const commands = [greeting.command, logincheck.command, ranking.command, zandaka.command];

client.on("interactionCreate", (interaction) => {
	if (interaction.isChatInputCommand()) commandHandler(interaction);
	// if (interaction.isButton()) buttonHandler(interaction);
	//	console.log(interaction);
});

function commandHandler(interaction: ChatInputCommandInteraction) {
	switch (interaction.commandName) {
		case "greeting":
			greeting.execute(interaction);
			break;
		case "logincheck":
			logincheck.execute(interaction);
			break;
		case "ranking":
			ranking.execute(interaction);
			break;
		case "zandaka":
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
