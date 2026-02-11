import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL2;

if (!databaseUrl) {
  throw new Error("DATABASE_URL2 is not set");
}

type StatusPayload = {
  phone: string;
  contacted: boolean;
  replied: boolean;
  updatedAt: number;
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

export const notifyInfoFeb8StatusInfo = async (payload: StatusPayload) => {
  const client = await getPool().connect();
  try {
    await client.query("SELECT pg_notify('info_feb8_status', $1)", [
      JSON.stringify(payload),
    ]);
  } finally {
    client.release();
  }
};

declare global {
  // eslint-disable-next-line no-var
  var __infoFeb8RealtimePoolInfo: RealtimeInfoPool | undefined;
}

export {};
