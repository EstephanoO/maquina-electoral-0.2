import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL2;

if (!databaseUrl) {
  throw new Error("DATABASE_URL2 is not set");
}

type RealtimeInfoPayload =
  | {
      type: "status" | "assignment";
      sourceId: string;
      phone?: string | null;
      contacted?: boolean;
      replied?: boolean;
      deleted?: boolean;
      assignedToId?: string | null;
      assignedToName?: string | null;
      assignedToEmail?: string | null;
      assignedAt?: number | null;
      updatedAt?: number;
    }
  | {
      type: "new_record";
      sourceId: string;
      recordedAt?: string | null;
      interviewer?: string | null;
      candidate?: string | null;
      name?: string | null;
      phone?: string | null;
      homeMapsUrl?: string | null;
      pollingPlaceUrl?: string | null;
      linksComment?: string | null;
      east?: string | number | null;
      north?: string | number | null;
      latitude?: string | number | null;
      longitude?: string | number | null;
    };

type RealtimeInfoPool = {
  pool: Pool;
};

const getPool = () => {
  if (!globalThis.__infoFeb8RealtimePoolInfo) {
    globalThis.__infoFeb8RealtimePoolInfo = {
      pool: new Pool({ connectionString: databaseUrl }),
    };
  }
  return globalThis.__infoFeb8RealtimePoolInfo.pool;
};

export const getRealtimeInfoClient = () => getPool().connect();

const getRealtimeInfoClientWithTimeout = async (timeoutMs = 1000) => {
  const connect = getPool().connect();
  return (await Promise.race([
    connect,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("connect timeout")), timeoutMs),
    ),
  ])) as Awaited<ReturnType<typeof getRealtimeInfoClient>>;
};

export const notifyInfoFeb8StatusInfo = async (payload: RealtimeInfoPayload) => {
  let client: Awaited<ReturnType<typeof getRealtimeInfoClient>> | null = null;
  try {
    client = await getRealtimeInfoClientWithTimeout(1000);
    const notify = client.query("SELECT pg_notify('info_feb8_status', $1)", [
      JSON.stringify(payload),
    ]);
    await Promise.race([
      notify,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("notify timeout")), 1000),
      ),
    ]);
  } catch {
    // noop
  } finally {
    client?.release();
  }
};

export { getRealtimeInfoClientWithTimeout };

declare global {
  // eslint-disable-next-line no-var
  var __infoFeb8RealtimePoolInfo: RealtimeInfoPool | undefined;
}

export {};
