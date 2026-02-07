import { NextResponse } from "next/server";
import { LANDINGS_TSV_URL } from "@/dashboards/guillermo/constants/dashboard";
import { parseLandingsTSV } from "@/dashboards/guillermo/utils/landingsParser";

export async function GET() {
  const response = await fetch(LANDINGS_TSV_URL, { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ error: "landings-fetch-failed" }, { status: 502 });
  }
  const text = await response.text();
  const data = parseLandingsTSV(text);
  return NextResponse.json({ data });
}
