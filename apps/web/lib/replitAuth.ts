import "server-only";
import { cookies, headers } from "next/headers";

export type ReplitUser = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  roles?: string[];
};

export async function getReplitUser(): Promise<ReplitUser | null> {
  try {
    const headerStore = await headers();
    const userId = headerStore.get("x-replit-user-id");
    const userName = headerStore.get("x-replit-user-name");
    const userRoles = headerStore.get("x-replit-user-roles");

    if (!userId || !userName) {
      return null;
    }

    return {
      id: userId,
      name: userName,
      email: `${userName}@users.replit.com`,
      roles: userRoles ? userRoles.split(",") : [],
    };
  } catch {
    return null;
  }
}

export async function requireReplitUser(): Promise<ReplitUser> {
  const user = await getReplitUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
