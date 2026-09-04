import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "drizzle-kit";

function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

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
  throw new Error("DATABASE_URL is required for Drizzle. Set it in .env.local or the deployment environment.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
});
