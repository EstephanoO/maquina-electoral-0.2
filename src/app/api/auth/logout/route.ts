import { NextResponse } from "next/server";
import { revokeSession, getSessionCookieName } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  const token = store.get(getSessionCookieName())?.value;
  if (token) {
    await revokeSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
