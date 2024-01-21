import { Hono } from "hono";
import oauth from "./oauth";
import refresh from "./refresh";

const app = new Hono()
	.get("/", (c) => c.json({ status: "ok" }))
	.route("/oauth", oauth)
	.route("/refresh", refresh);
export type AppType = typeof app;
Bun.serve({
	fetch: app.fetch,
	port: 5038,
});
