import * as sqlite from "bun:sqlite";
import { exists } from "fs-extra";

if (!(await exists("./bot.db"))) {
	const db = new sqlite.Database("./bot.db");
	db.exec("create table nissmick (ID INT(3))");
	db.close();
} else {
	console.log("db already exists.");
}
