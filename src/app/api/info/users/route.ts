import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db/connection";
import { authUsers } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { INFO_ADMIN_EMAIL, INFO_EMAIL_DOMAIN, isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

type CreatePayload = {
  email?: string;
  name?: string;
  role?: "admin" | "candidato";
};

type ResetPayload = {
  userId?: string;
  email?: string;
};

const isAdmin = (email?: string | null, role?: string | null) => {
  if (!email) return false;
  if (email.trim().toLowerCase() === INFO_ADMIN_EMAIL) return true;
  return role === "admin";
};

const isInfoDomainEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${INFO_EMAIL_DOMAIN}`);
};

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email, user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      name: authUsers.name,
      role: authUsers.role,
      passwordHash: authUsers.passwordHash,
      createdAt: authUsers.createdAt,
      updatedAt: authUsers.updatedAt,
    })
    .from(authUsers);

  const users = rows
    .filter((row) => isInfoUserEmail(row.email))
    .map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      hasPassword: Boolean(row.passwordHash),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
    .sort((a, b) => a.email.localeCompare(b.email, "es"));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email, user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as CreatePayload;
  const email = payload.email?.trim().toLowerCase();
  const name = payload.name?.trim();
  const role = payload.role === "admin" ? "admin" : "candidato";

  if (!email || !name) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  if (!isInfoDomainEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "User exists" }, { status: 409 });
  }

  await db.insert(authUsers).values({
    id: randomUUID(),
    email,
    name,
    role,
    passwordHash: null,
    campaignId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email, user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ResetPayload;
  const email = payload.email?.trim().toLowerCase();
  const userId = payload.userId?.trim();

  if (!email && !userId) {
    return NextResponse.json({ error: "Missing user" }, { status: 400 });
  }

  const whereClause = email ? eq(authUsers.email, email) : eq(authUsers.id, userId ?? "");

  await db
    .update(authUsers)
    .set({ passwordHash: null, updatedAt: new Date() })
    .where(whereClause);

  return NextResponse.json({ ok: true });
}
