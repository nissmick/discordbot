import { Hono } from "hono";
import { validator } from "hono/validator";
import * as z from "zod";
import { prisma } from "../core/src/store";
import { generateJWT, jwtVerifiy } from "./oauth/callback";
const reqType = z.object({
	token: z.string(),
});
const app = new Hono().post(
	"/",
	validator("json", (data, c) => {
		const parsed = reqType.safeParse(data);
		if (parsed.success) {
			return parsed.data;
		} else {
			return c.json({
				error: "Bad Request",
			});
		}
	}),
	async (c) => {
		const { valid } = checkAuth(c.req.header());
		if (valid) {
			return c.json(
				{
					error: "Unauthorized",
					status: false,
				},
				401
			);
		}
		const req = c.req.valid("json");
		const column = await prisma.refreshToken.findUnique({
			where: {
				token: req.token,
			},
		});
		// 存在しないリフレッシュトークン
		if (!column) {
			return c.json(
				{
					status: false,
					error: "INVALID_REFRESH_TOKEN",
				} as const,
				400
			);
		}
		// 期限切れ
		if (column.expireAt.valueOf() < Date.now()) {
			return c.json(
				{
					status: false,
					error: "INVALID_REFRESH_TOKEN",
				} as const,
				400
			);
		}
		const new_token = await generateJWT(column.userId.toString());
		// トークン削除
		await prisma.refreshToken.delete({
			where: {
				token: req.token,
			},
		});
		return c.json({
			token: new_token.token,
			refresh: {
				expireAt: new_token.refresh.expireAt,
				token: new_token.refresh.token,
			},
		});
	}
);

function checkAuth(
	header: Readonly<Record<string, string>>
): { valid: false } | { valid: true; data: { [x: string]: unknown } } {
	const auth = header["Authorization"];
	if (!auth) {
		return { valid: false };
	}
	if (!auth.startsWith("Bearer")) {
		return { valid: false };
	}
	const token = auth.replace("Bearer ", "");
	const verify = jwtVerifiy(token);
	if (verify.status) {
		return { valid: true, data: verify.verifyed };
	} else {
		return { valid: false };
	}
}

export default app;
