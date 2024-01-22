import prisma from "database";
import jwt from "jsonwebtoken";
import config from "../../../config.json";

export async function generateJWT(id: string | bigint) {
	const token = jwt.sign(
		{
			user: id.toString(),
		},
		config.jwt.secret,
		{
			algorithm: "HS256",
			subject: "user",
			expiresIn: 1000 * 60 * 5, // 5分
		}
	);
	const date = new Date(Date.now() + 1000 * 3600 * 24 * 7); // 7日間
	const refresh = await prisma.refreshToken.create({
		data: {
			expireAt: date,
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
export type UserJwt = {
	user: string;
	iat: number;
	exp: number;
	sub: string;
};
export type JwtError = "TOKEN_INVALID" | "TOKEN_EXPIRED" | "TOKEN_NOTBEFORE";
export function checkAuth(authHeader: string): { valid: false; reason: JwtError } | { valid: true; data: UserJwt } {
	const token = authHeader.replace("Bearer ", "");
	const verify = jwtVerify<UserJwt>(token);
	if (verify.status) {
		return { valid: true, data: verify.verified };
	} else {
		return { valid: false, reason: verify.reason };
	}
}
