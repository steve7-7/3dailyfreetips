import { db } from "@/db";
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

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      database: { connected: true },
      supabase: isSupabaseConfigured(),
      service: "goaledge",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: { connected: false, errorCode: getErrorCode(error) ?? "UNKNOWN" },
        supabase: isSupabaseConfigured(),
        service: "goaledge",
      },
      { status: 500 },
    );
  }
}
