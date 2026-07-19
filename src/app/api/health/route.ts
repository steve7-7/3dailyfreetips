import { db } from "@/db";
import { sql } from "drizzle-orm";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      supabase: isSupabaseConfigured(),
      service: "goaledge",
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
