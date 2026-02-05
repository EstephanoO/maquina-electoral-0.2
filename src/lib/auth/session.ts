import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { authSessions, authUsers } from "@/db/schema";
import type { SessionUser } from "@/lib/auth/types";

const sessionCookieName = "maquina_session";
const sessionDays = 30;

const buildSessionUser = (row: {
  id: string;
  email: string;
  name: string;
  role: string;
  campaignId: string | null;
}): SessionUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role === "admin" ? "admin" : "candidato",
  campaignId: row.campaignId,
  assignedCampaignIds: row.campaignId ? [row.campaignId] : [],
});

export const getSessionCookieName = () => sessionCookieName;

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (!token) return null;
  return getSessionUserByToken(token);
};

export const getSessionUserByToken = async (token: string): Promise<SessionUser | null> => {
  const rows = await db
    .select({
      sessionId: authSessions.id,
      userId: authUsers.id,
      email: authUsers.email,
      name: authUsers.name,
      role: authUsers.role,
      campaignId: authUsers.campaignId,
      expiresAt: authSessions.expiresAt,
    })
    .from(authSessions)
    .innerJoin(authUsers, eq(authSessions.userId, authUsers.id))
    .where(and(eq(authSessions.token, token), sql`${authSessions.expiresAt} > now()`));

  const row = rows[0];
  if (!row) {
    await db.delete(authSessions).where(eq(authSessions.token, token));
    return null;
  }
  return buildSessionUser({
    id: row.userId,
    email: row.email,
    name: row.name,
    role: row.role,
    campaignId: row.campaignId,
  });
};

export const createSession = async (userId: string) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
  await db.insert(authSessions).values({
    id: randomUUID(),
    userId,
    token,
    expiresAt,
  });
  return { token, expiresAt };
};

export const revokeSession = async (token: string) => {
  await db.delete(authSessions).where(eq(authSessions.token, token));
};
