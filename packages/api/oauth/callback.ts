import { Hono } from "hono";
import config from "../../../config.json";
import prisma from "database";
import jwt from "jsonwebtoken";
import { APIUser } from "discord-api-types/v10";

type DiscordOAuth2JSON = {
	// eslint-disable-next-line @typescript-eslint/ban-types
	token_type: (string & {}) | "Bearer";
	access_token: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
};
type OAuth2Error = {
	error: string;
	error_description: string;
};

const app = new Hono().get("/callback", async (c) => {
	const query = c.req.query();
	if (!("code" in query)) {
		return c.json(
			{
				status: false,
				error: "code missing",
			},
			400
		);
	}
	const payload = new URLSearchParams({
		client_id: config.client_id,
		client_secret: config.oauth2.secret,
		grant_type: "authorization_code",
		code: query.code,
		redirect_uri: config.oauth2.redirect,
	});
	const res = await fetch("https://discordapp.com/api/oauth2/token", {
		body: payload,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		method: "post",
	});
	if (res.ok) {
		const authData = (await res.json()) as DiscordOAuth2JSON;
		console.log(authData);
		const scope = new Set(authData.scope.split(" "));
		// トークンの権限が足りているか
		const isTrustToken = config.oauth2.scope.every((s) => scope.has(s));
		if (!isTrustToken) {
			// 権限たりない
			return c.json(
				{
					status: false,
					error: "SCOPE_MISSING",
					message: `${config.oauth2.scope.join(",")}が必要ですが、そのうち${
						authData.scope
					}しか渡されませんでした。`,
				},
				403
			);
		}
		// トークンが正常なのは証明されてる
		const fetched = await fetchUserFromAccesToken(authData.access_token);
		if (!fetched.success) {
			// なんで失敗したん
			return c.json(
				{
					status: false,
					error: "internal server error",
					message: "不明なエラーです",
				},
				500
			);
		}
		const { user } = fetched;
		const column = await prisma.discordAuth.findUnique({
			where: {
				userId: BigInt(user.id),
			},
		});
		// authがもうある
		if (column) {
			const jwt = await generateJWT(user.id);
			return c.json({
				status: true,
				message: "あなたはもうカラムあります",
				user,
				token: {
					token: jwt.token,
					refresh: {
						token: jwt.refresh.token,
						expireAt: jwt.refresh.expireAt,
					},
				},
			});
		}
		// カラムなかった時
		await prisma.discordAuth.create({
			data: {
				user: {
					// ユーザーがいたら接続、いなければ作る
					connectOrCreate: {
						where: {
							id: BigInt(user.id),
						},
						create: {
							isBot: false,
							discord_username: user.username,
							id: BigInt(user.id),
							loginBonus: {
								create: {},
							},
							iconUrl: user.avatar
								? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
								: undefined,
						},
					},
				},
				accessToken: authData.access_token,
				expiresIn: authData.expires_in,
				refreshToken: authData.refresh_token,
			},
		});
		const jwt = await generateJWT(user.id);
		return c.json(
			{
				status: true,
				user,
				message: "テーブルを作成しました",
				token: {
					token: jwt.token,
					refresh: {
						token: jwt.refresh.token,
						expireAt: jwt.refresh.expireAt,
					},
				},
			},
			201
		);
	} else {
		const json = (await res.json()) as OAuth2Error;
		if (json.error === "invalid_grant") {
			return c.json(
				{
					error: "CODE_INVALID",
					message: "codeが無効です。",
				},
				400
			);
		}
		console.error(json);
		return c.json(
			{
				error: "internal server error",
			},
			500
		);
	}
});
async function fetchUserFromAccesToken(
	access_token: string
): Promise<{ success: true; user: APIUser } | { success: false }> {
	const res = await fetch(" https://discordapp.com/api/users/@me", {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});
	if (res.ok) {
		const user = (await res.json()) as APIUser;
		return { success: true, user } as const;
	} else {
		console.log(await res.json());
		return { success: false } as const;
	}
}

export default app;

export async function generateJWT(id: string | bigint) {
	const token = jwt.sign(
		{
			user: id.toString(),
		},
		config.jwt.secret,
		{
			algorithm: "HS256",
			subject: "user",
			expiresIn: 1_000 * 60 * 5, // 5分
		}
	);
	const date = new Date(Date.now() + 1_000 * 3_600 * 24 * 7); // 7日間
	const refresh = await prisma.refreshToken.create({
		data: {
			expireAt: date,
			token: crypto.randomUUID(),
			user: {
				connect: {
					id: BigInt(id),
				},
			},
		},
	});
	return {
		token,
		refresh,
	};
}
export type JwtError = "TOKEN_INVALID" | "TOKEN_EXPIRED" | "TOKEN_NOTBEFORE";
export type UserJwt = {
	user: string;
	iat: number;
	exp: number;
	sub: string;
};
export function jwtVerify<T extends { [x: string]: unknown } = { [x: string]: unknown }>(
	token: string
): { status: true; verified: T } | { status: false; reason: JwtError } {
	try {
		const verified = jwt.verify(token, config.jwt.secret, {
			algorithms: ["HS256"],
		}) as T;
		return { status: true, verified };
	} catch (e) {
		if (e instanceof jwt.JsonWebTokenError) {
			return { status: false, reason: "TOKEN_INVALID" };
		} else if (e instanceof jwt.TokenExpiredError) {
			return { status: false, reason: "TOKEN_EXPIRED" };
		} else if (e instanceof jwt.NotBeforeError) {
			return { status: false, reason: "TOKEN_NOTBEFORE" };
		} else {
			throw new Error("Token認証時に予期せぬエラー", {
				cause: e,
			});
		}
	}
}
