import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";
import { getRealtimeInfoClient } from "@/db/realtime-info";

export const runtime = "nodejs";

type RealtimePayload = {
  type?: "status" | "assignment";
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
};

const encoder = new TextEncoder();

const formatEvent = (event: string, data: unknown) =>
  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = isInfoAdminEmail(user.email);

  const stream = new ReadableStream({
    async start(controller) {
      const client = await getRealtimeInfoClient();
      let pingTimer: NodeJS.Timeout | null = null;
      let closed = false;

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
          // noop
        }
      };

      const abortHandler = () => {
        void cleanup();
      };

      request.signal.addEventListener("abort", abortHandler);

      try {
        await client.query("LISTEN info_feb8_status");
        controller.enqueue(formatEvent("ready", { ok: true }));

        client.on("notification", (msg) => {
          if (!msg.payload) return;
          try {
            const payload = JSON.parse(msg.payload) as RealtimePayload;
            if (!payload.type || !payload.sourceId) return;

            if (payload.type === "assignment") {
              if (!isAdmin && payload.assignedToId && payload.assignedToId !== user.id) {
                controller.enqueue(
                  formatEvent("assignment", {
                    type: "assignment",
                    sourceId: payload.sourceId,
                    assignedToId: payload.assignedToId,
                    assignedAt: payload.assignedAt ?? Date.now(),
                  }),
                );
                return;
              }
              controller.enqueue(
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

            controller.enqueue(
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
          controller.enqueue(formatEvent("ping", { ts: Date.now() }));
        }, 25000);
      } catch {
        await cleanup();
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
