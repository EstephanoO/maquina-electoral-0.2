import { getRequestId, jsonResponse, logApiEvent } from "@/lib/api/http";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const route = new URL(request.url).pathname;
  const status = 200;
  logApiEvent({
    requestId,
    route,
    method: "GET",
    status,
    durationMs: Date.now() - startedAt,
  });
  return jsonResponse({ ok: true }, requestId, { status });
}
