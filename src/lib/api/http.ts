import { NextResponse } from "next/server";

type ApiLogEvent = {
  requestId: string;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  errorCode?: string;
  itemsCount?: number;
};

export const getRequestId = (request: Request) =>
  request.headers.get("x-request-id")?.trim() || crypto.randomUUID();

export const jsonResponse = (
  data: unknown,
  requestId: string,
  init?: ResponseInit,
) => {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  return NextResponse.json(data, { ...init, headers });
};

export const logApiEvent = (event: ApiLogEvent) => {
  console.info(
    JSON.stringify({
      type: "api",
      at: new Date().toISOString(),
      ...event,
    }),
  );
};
