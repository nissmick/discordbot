import { Events, REST, Routes } from "discord.js";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import config from "./config.json";
import * as greeting from "./commands/greeting";
import * as logincheck from "./commands/loginbonus";
import * as ranking from "./commands/ranking";
import * as zandaka from "./commands/zandaka";
import * as misskey_emoji from "./commands/misskey-emoji";
import * as exec from "./commands/exec";
import { Commands } from "./enum";
import { client, prisma } from "./store";
import { EmojiResolver } from "./emoji_store";
import stringWidth from "string-width";
const rest = new REST().setToken(config.token);
const commands = [
	greeting.command,
	logincheck.command,
	ranking.command,
	zandaka.command,
	misskey_emoji.command,
	exec.command,
];
const emojiResolvers: Map<bigint, EmojiResolver> = new Map();
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
client.on(Events.MessageCreate, async (message) => {
	logger(message, "create");
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
				},
				update: {
					screen_name: member.displayName,
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

function logger(message: Message<true>, type: "create" | "edit" | "delete") {
	const time = `${message.createdAt.toISOString()} <t:${message.createdAt.valueOf().toString().slice(0, -3)}>`;
	const author = `${message.author.tag}${message.author.bot ? " [bot]" : ""} <@${message.author.id}>`;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const guild = `${message.guildId === config.homeserver ? "" : message.guild.name}`;
	const channel = `${message.channel.name}`;
	const [firstcontent, ...content] = message.content.split("\n");
	const showContent = [
		`| time:   ${time} `,
		`| author: ${author} `,
		`| content: ${firstcontent} `,
		...content.map((i) => `|          ${i} `),
		`| channel:${channel}`,
	] as const;
	const linewidth = Math.max(...showContent.map((item) => stringWidth(item)));
	if (linewidth > process.stdout.columns) {
		// 後でなんとかする
	}
	console.log(`┌${"─".repeat(linewidth - 1)}┐`);
	showContent.map((i) => padEnd(i, linewidth, " ") + "|").forEach((item) => console.log(item));
	console.log(`└${"─".repeat(linewidth - 1)}┘`);
}

function padEnd(str: string, targetWidth: number, padChar = " ") {
	const currentWidth = stringWidth(str);

	if (currentWidth >= targetWidth) {
		return str;
	}

	const paddingLength = targetWidth - currentWidth;
	const padding = padChar.repeat(paddingLength);

	return str + padding;
}
