import { NextResponse } from "next/server";
import { db } from "@/db/connection";
import { territory } from "@/db/schema";

type InterviewPayload = {
  id: string;
  interviewer: string;
  candidate: string;
  signature: string;
  name: string;
  phone: string;
  location: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
};

const requiredKeys: Array<keyof InterviewPayload> = [
  "id",
  "interviewer",
  "candidate",
  "signature",
  "name",
  "phone",
  "location",
  "createdAt",
];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<InterviewPayload>;
  const missing = requiredKeys.filter((key) => !body[key]);

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Missing fields", fields: missing },
      { status: 400 },
    );
  }

  await db.insert(territory).values({
    id: body.id as string,
    interviewer: body.interviewer as string,
    candidate: body.candidate as string,
    signature: body.signature as string,
    name: body.name as string,
    phone: body.phone as string,
    location: body.location as string,
    createdAt: new Date(body.createdAt as string),
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    srid: 4326,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
