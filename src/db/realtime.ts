import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

type StatusPayload = {
  phone: string;
  contacted: boolean;
  replied: boolean;
  updatedAt: number;
};

type RealtimePool = {
  pool: Pool;
};

const getPool = () => {
  if (!globalThis.__infoFeb8RealtimePool) {
    globalThis.__infoFeb8RealtimePool = { pool: new Pool({ connectionString: databaseUrl }) };
  }
  return globalThis.__infoFeb8RealtimePool.pool;
};

export const getRealtimeClient = () => getPool().connect();

export const notifyInfoFeb8Status = async (payload: StatusPayload) => {
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
  var __infoFeb8RealtimePool: RealtimePool | undefined;
}

export {};
