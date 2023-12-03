import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import type { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import config from "./config.json";
import * as greeting from "./greeting";
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
const commands = [greeting.command];

client.on("interactionCreate", (interaction) => {
	if (interaction.isChatInputCommand()) commandHandler(interaction);
	if (interaction.isButton()) buttonHandler(interaction);
	console.log(interaction);
});

function commandHandler(interaction: ChatInputCommandInteraction) {
	switch (interaction.commandName) {
		case "greeting":
			greeting.execute(interaction);
	}
}

function buttonHandler(interaction: ButtonInteraction) {}

client.once(Events.ClientReady, async (readyClient) => {
	await rest.put(Routes.applicationCommands(config.client_id), {
		body: commands,
	});
	const homeserver = client.guilds.cache.get(config.homeserver)!;
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	console.log(homeserver.name);
	console.log("Fetching Member...");
	const members = await homeserver.members.fetch();
	console.log("Processing Member...");
	const processed_members = Promise.all(
		members.map((user) => {
			console.log(user.user.username);
			return prisma.user.upsert({
				where: {
					discord_id: BigInt(user.id),
				},
				create: {
					discord_id: BigInt(user.user.id),
					discord_username: user.user.username,
					screen_name: user.displayName,
				},
				update: {
					screen_name: user.displayName,
				},
			});
		})
	);
	await processed_members;
	console.log("All Member Processed!");
});
console.log("Hello via Bun!");

client.login(config.token);
