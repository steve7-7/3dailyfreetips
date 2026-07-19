import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { predictionInputSchema } from "@/lib/validation";
import { listPredictions, decorate, invalidatePredictionCache } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const tier = searchParams.get("tier") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const limitParam = Number(searchParams.get("limit") ?? 0);

  const rows = await listPredictions(
    { status, tier, q },
    user?.plan === "premium" || user?.role === "admin",
    limitParam > 0 ? limitParam : 0,
  );

  return NextResponse.json({ predictions: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = predictionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { kickoffAt, ...rest } = parsed.data;
  const [created] = await db
    .insert(predictions)
    .values({ ...rest, kickoffAt: new Date(kickoffAt) })
    .returning();

  invalidatePredictionCache();

  return NextResponse.json(
    { prediction: decorate(created!, user.plan === "premium") },
    { status: 201 },
  );
}
