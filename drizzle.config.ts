import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

function cleanConnectionString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getDatabaseUrl(): string | undefined {
  // Accept the POSTGRES_* variables auto-provided by Vercel's
  // Postgres/Supabase integrations, mirroring src/db/index.ts.
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
  ];
  for (const candidate of candidates) {
    const cleaned = cleanConnectionString(candidate);
    if (cleaned) return cleaned;
  }

  // Backward compatibility for older local .env files that contained only the
  // connection string on the first line instead of DATABASE_URL=...
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    return readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /^postgres(?:ql)?:\/\//i.test(line));
  }

  return undefined;
}

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Drizzle (POSTGRES_PRISMA_URL / POSTGRES_URL are also accepted). " +
      "Set it in .env.local or the deployment environment.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
});
