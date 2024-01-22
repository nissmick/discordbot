import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import * as v from "valibot";
import { prisma } from "../core/src/store";
import { generateJWT } from "./@auth";
import { badRequest, unauthorized } from "./@template";
import { checkAuth } from "./@auth";
const reqType = v.object({
	refresh: v.string(),
});
const headerType = v.object({
	// Bearerで始まることを要求する
	authorization: v.string([v.startsWith("Bearer ")]),
});

const invalid_token = {
	status: false,
	error: "INVALID_REFRESH_TOKEN",
} as const;

const app = new Hono().post(
	"/",
	vValidator("json", reqType),
	vValidator("header", headerType, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					...badRequest,
					issues: result.issues,
				},
				400
			);
		}
	}),
	async (c) => {
		const header = c.req.valid("header");
		const authData = checkAuth(header.authorization);
		if (!authData.valid) {
			return c.json(unauthorized, 401);
		}
		// リクエストボディ
		const { refresh } = c.req.valid("json");
		// 一致するリフレッシュトークンを探す
		const column = await findRefreshToken(refresh);
		// 存在しないリフレッシュトークン
		if (!column) {
			return c.json(invalid_token, 400);
		}
		// 期限切れ
		if (column.expireAt.valueOf() < Date.now()) {
			return c.json(invalid_token, 400);
		}
		if (column.userId === BigInt(authData.data.user)) {
			// 新しくトークンを生成する
			const {
				token,
				refresh: { expireAt, token: refresh },
			} = await generateJWT(column.userId);
			// 使用済みのトークン削除
			await prisma.refreshToken.delete({ where: { token: column.token } });
			return c.json({
				token,
				refresh: {
					expireAt,
					token: refresh,
				},
			});
		}
	}
);

function findRefreshToken(refresh_token: string) {
	return prisma.refreshToken.findUnique({ where: { token: refresh_token } });
}

export default app;
