import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";
import { getRealtimeInfoClientWithTimeout } from "@/db/realtime-info";

export const runtime = "nodejs";

type RealtimePayload = {
  type?: "status" | "assignment" | "new_record";
  sourceId?: string | null;
  phone?: string | null;
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedAt?: number | null;
  updatedAt?: number;
  recordedAt?: string | null;
  interviewer?: string | null;
  candidate?: string | null;
  name?: string | null;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
  east?: string | number | null;
  north?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

const encoder = new TextEncoder();

const formatEvent = (event: string, data: unknown) =>
  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = user.role === "admin" || isInfoAdminEmail(user.email);

  let client: Awaited<ReturnType<typeof getRealtimeInfoClientWithTimeout>> | null = null;
  try {
    client = await getRealtimeInfoClientWithTimeout(1500);
  } catch {
    return NextResponse.json({ error: "Realtime unavailable" }, { status: 503 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let pingTimer: NodeJS.Timeout | null = null;
      let closed = false;

      const safeEnqueue = (data: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(data);
        } catch {
          // ignore if stream already closed
        }
      };

      const cleanup = async () => {
        if (closed) return;
        closed = true;
        if (pingTimer) clearInterval(pingTimer);
        client.removeAllListeners("notification");
        try {
          await client.query("UNLISTEN info_feb8_status");
        } catch {
          // noop
        }
        client.release();
        try {
          controller.close();
        } catch {
          // ignore if already closed
        }
      };

      const abortHandler = () => {
        void cleanup();
      };

      request.signal.addEventListener("abort", abortHandler);

      try {
        await client.query("LISTEN info_feb8_status");
        const debug = await client.query(
          "SELECT current_database() AS db, inet_server_addr()::text AS host, pg_backend_pid() AS pid",
        );
        const debugRow = debug.rows?.[0] ?? {};
        safeEnqueue(
          formatEvent("ready", {
            ok: true,
            db: debugRow.db ?? null,
            host: debugRow.host ?? null,
            pid: debugRow.pid ?? null,
          }),
        );

        client.on("notification", (msg) => {
          if (!msg.payload) return;
          try {
            const payload = JSON.parse(msg.payload) as RealtimePayload;
            if (!payload.type || !payload.sourceId) return;

            if (payload.type === "new_record") {
              safeEnqueue(
                formatEvent("new_record", {
                  type: "new_record",
                  sourceId: payload.sourceId,
                  recordedAt: payload.recordedAt ?? null,
                  interviewer: payload.interviewer ?? null,
                  candidate: payload.candidate ?? null,
                  name: payload.name ?? null,
                  phone: payload.phone ?? null,
                  homeMapsUrl: payload.homeMapsUrl ?? null,
                  pollingPlaceUrl: payload.pollingPlaceUrl ?? null,
                  linksComment: payload.linksComment ?? null,
                  east: payload.east ?? null,
                  north: payload.north ?? null,
                  latitude: payload.latitude ?? null,
                  longitude: payload.longitude ?? null,
                }),
              );
              return;
            }

            if (payload.type === "assignment") {
              if (!isAdmin && payload.assignedToId && payload.assignedToId !== user.id) {
                safeEnqueue(
                  formatEvent("assignment", {
                    type: "assignment",
                    sourceId: payload.sourceId,
                    assignedToId: payload.assignedToId,
                    assignedAt: payload.assignedAt ?? Date.now(),
                  }),
                );
                return;
              }
              safeEnqueue(
                formatEvent("assignment", {
                  type: "assignment",
                  sourceId: payload.sourceId,
                  assignedToId: payload.assignedToId ?? null,
                  assignedToName: payload.assignedToName ?? null,
                  assignedToEmail: payload.assignedToEmail ?? null,
                  assignedAt: payload.assignedAt ?? Date.now(),
                }),
              );
              return;
            }

            if (!isAdmin && payload.assignedToId && payload.assignedToId !== user.id) {
              return;
            }

            safeEnqueue(
              formatEvent("status", {
                type: "status",
                sourceId: payload.sourceId,
                phone: payload.phone ?? null,
                contacted: Boolean(payload.contacted),
                replied: Boolean(payload.replied),
                deleted: Boolean(payload.deleted),
                assignedToId: payload.assignedToId ?? null,
                assignedToName: payload.assignedToName ?? null,
                assignedToEmail: payload.assignedToEmail ?? null,
                updatedAt: payload.updatedAt ?? Date.now(),
              }),
            );
          } catch {
            // ignore invalid payload
          }
        });

        pingTimer = setInterval(() => {
          safeEnqueue(formatEvent("ping", { ts: Date.now() }));
        }, 25000);
      } catch {
        await cleanup();
      } finally {
        request.signal.removeEventListener("abort", abortHandler);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
