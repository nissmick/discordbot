throw new Error("こんなコード実行するって正気？");

import { prisma } from "./store";

const messages = await prisma.collaborativeMessage.findMany();

console.log(messages);

for (const column of messages) {
	console.log(`https://discord.com/channels/${column.guildId}/${column.channelId}/${column.messageId}`);
	/*const d = await prisma.collaborativeMessage.delete({
		include: {
			collaborator: true,
			editable: true,
		},
		where: {
			id: column.id,
		},
	});
	console.log(d);*/
}
