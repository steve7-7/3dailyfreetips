import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type SafeUser } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "./session";

function stripPassword(user: (typeof users.$inferSelect) | undefined) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe as SafeUser;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload?.sub) return null;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);
    return stripPassword(user);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=auth");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard?reason=forbidden");
  return user;
}

export async function setSessionCookie(userId: number) {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}
