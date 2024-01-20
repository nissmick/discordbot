import { Hono } from "hono";
import oauth from "./oauth";

const app = new Hono().get("/", (c) => c.json({ status: "ok" })).route("/oauth", oauth);

Bun.serve({
	fetch: app.fetch,
	port: 5038,
});
