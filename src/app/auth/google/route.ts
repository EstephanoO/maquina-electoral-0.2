import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { authUsers } from "@/db/schema";
import { createSession, getSessionCookieName } from "@/lib/auth/session";

export const runtime = "nodejs";

const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const googleIssuers = ["https://accounts.google.com", "accounts.google.com"];

type GoogleAuthPayload = {
  idToken?: string;
};

const getAllowedOrigins = () =>
  (process.env.AUTH_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const buildCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);
  const headers = new Headers();

  if (origin && isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");

  return { headers, isAllowed };
};

const jsonError = (message: string, status: number, headers: Headers) =>
  NextResponse.json({ error: message }, { status, headers });

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const { headers, isAllowed } = buildCorsHeaders(origin);

  if (!isAllowed) {
    return jsonError("Origin not allowed", 403, headers);
  }

  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const { headers, isAllowed } = buildCorsHeaders(origin);

  if (!isAllowed) {
    return jsonError("Origin not allowed", 403, headers);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!googleClientId) {
    return jsonError("Missing GOOGLE_CLIENT_ID", 500, headers);
  }

  let body: GoogleAuthPayload;
  try {
    body = (await request.json()) as GoogleAuthPayload;
  } catch {
    return jsonError("Invalid JSON body", 400, headers);
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    return jsonError("Missing idToken", 400, headers);
  }

  let payload: { [key: string]: unknown };
  try {
    const result = await jwtVerify(idToken, jwks, {
      audience: googleClientId,
      issuer: googleIssuers,
    });
    payload = result.payload as { [key: string]: unknown };
  } catch {
    return jsonError("Invalid idToken", 401, headers);
  }

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (!email || !emailVerified) {
    return jsonError("Unverified email", 401, headers);
  }

  const rows = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      name: authUsers.name,
    })
    .from(authUsers)
    .where(eq(authUsers.email, email));

  let user = rows[0];
  if (!user) {
    const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0];
    const created = await db
      .insert(authUsers)
      .values({
        id: randomUUID(),
        email,
        name,
        role: "candidato",
        passwordHash: randomBytes(48).toString("hex"),
        campaignId: null,
      })
      .returning({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
      });

    user = created[0];
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json(
    {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    },
    { headers },
  );

  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return response;
}
