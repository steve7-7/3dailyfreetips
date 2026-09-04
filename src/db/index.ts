import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import * as schema from "./schema";

function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Backward compatibility for older local .env files that contained only the
  // connection string on the first line instead of DATABASE_URL=...
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const rawUrl = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /^postgres(?:ql)?:\/\//i.test(line));

    if (rawUrl) return rawUrl;
  }

  return undefined;
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to .env.local or your deployment environment.");
}

function shouldUseSsl(connectionString: string): boolean {
  const parsed = new URL(connectionString);
  const sslMode = parsed.searchParams.get("sslmode");
  const host = parsed.hostname;

  if (sslMode === "disable") return false;
  if (sslMode === "require") return true;

  return host !== "localhost" && host !== "127.0.0.1";
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
