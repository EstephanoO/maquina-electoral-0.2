import { getRealtimeClient } from "@/db/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const encoder = new TextEncoder();
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let client: Awaited<ReturnType<typeof getRealtimeClient>> | null = null;
  let notificationHandler: ((message: { channel: string; payload?: string }) => void) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: { type: string; payload: unknown }) => {
        const data = `event: ${event.type}\n` + `data: ${JSON.stringify(event.payload)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };
      controller.enqueue(encoder.encode("retry: 2000\n\n"));
      try {
        client = await getRealtimeClient();
        await client.query("LISTEN info_feb8_status");
        notificationHandler = (message) => {
          if (message.channel !== "info_feb8_status" || !message.payload) return;
          try {
            const payload = JSON.parse(message.payload) as unknown;
            send({ type: "status:update", payload });
          } catch {
            // ignore malformed payloads
          }
        };
        client.on("notification", notificationHandler);
      } catch (error) {
        send({
          type: "error",
          payload: {
            message: error instanceof Error ? error.message : "Realtime error",
          },
        });
        controller.close();
        return;
      }
      pingTimer = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 20000);
      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
    },
    async cancel() {
      if (pingTimer) clearInterval(pingTimer);
      if (client && notificationHandler) {
        client.removeListener("notification", notificationHandler);
        await client.query("UNLISTEN info_feb8_status");
      }
      if (client) client.release();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
