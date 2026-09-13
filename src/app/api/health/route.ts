import { sql } from "drizzle-orm";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object") {
    const maybeCode = (error as { code?: unknown; cause?: { code?: unknown } }).code;
    const maybeCauseCode = (error as { cause?: { code?: unknown } }).cause?.code;
    if (typeof maybeCode === "string") return maybeCode;
    if (typeof maybeCauseCode === "string") return maybeCauseCode;
  }
  return undefined;
}

function isMissingConfig(error: unknown): boolean {
  return error instanceof Error && /DATABASE_URL is required/.test(error.message);
}

export async function GET() {
  try {
    // Dynamic import so a missing DATABASE_URL is reported as JSON instead
    // of crashing the route module at load time.
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      database: { connected: true },
      supabase: isSupabaseConfigured(),
      service: "goaledge",
    });
  } catch (error) {
    const missingConfig = isMissingConfig(error);
    return Response.json(
      {
        ok: false,
        database: {
          connected: false,
          configured: !missingConfig,
          errorCode: missingConfig ? "NOT_CONFIGURED" : (getErrorCode(error) ?? "UNKNOWN"),
        },
        supabase: isSupabaseConfigured(),
        service: "goaledge",
      },
      { status: 500 },
    );
  }
}
