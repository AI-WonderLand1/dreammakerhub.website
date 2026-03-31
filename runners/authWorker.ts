import "server-only";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env, requireEnv } from "../lib/env";
import { logger } from "../lib/logger";

export async function verifyAuth(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: requireEnv(env.NEXTAUTH_SECRET, "NEXTAUTH_SECRET") });

    if (!token) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: {
        id: token.sub,
        email: token.email,
        name: token.name,
      },
    };
  } catch (err) {
    logger.error("AuthWorker error", { error: err instanceof Error ? err.message : err });
    return {
      authenticated: false,
      user: null,
    };
  }
}
