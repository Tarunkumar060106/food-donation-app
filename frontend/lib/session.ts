import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, decodeSession, homeFor } from "./session-core";
import type { Role } from "./types";

export { SESSION_COOKIE, decodeSession, homeFor };

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function getSession() {
  return decodeSession(await getToken());
}

/** For server components: sends signed-out visitors to sign-in and wrong roles to their own home. */
export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (roles && !roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}

export const sessionCookieOptions = (expiresAt: string) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires: new Date(expiresAt),
});
