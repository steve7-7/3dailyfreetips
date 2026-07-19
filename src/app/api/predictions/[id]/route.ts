import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { predictions, type Prediction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { predictionPatchSchema } from "@/lib/validation";
import { invalidatePredictionCache } from "@/lib/queries";

export const dynamic = "force-dynamic";

function decorate(row: Prediction, isPremium: boolean) {
  const locked = row.isPremium && !isPremium;
  return { ...row, locked, analysis: locked ? null : row.analysis };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const isPremium = user?.plan === "premium" || user?.role === "admin";

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(predictions)
    .where(eq(predictions.id, numericId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  return NextResponse.json({ prediction: decorate(row, isPremium) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const parsed = predictionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { kickoffAt, ...rest } = parsed.data;

  const [updated] = await db
    .update(predictions)
    .set({ ...rest, ...(kickoffAt ? { kickoffAt: new Date(kickoffAt) } : {}) })
    .where(eq(predictions.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  invalidatePredictionCache();

  return NextResponse.json({
    prediction: decorate(updated, user.plan === "premium"),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [deleted] = await db
    .delete(predictions)
    .where(eq(predictions.id, Number(id)))
    .returning({ id: predictions.id });

  if (!deleted) {
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
  }

  invalidatePredictionCache();

  return NextResponse.json({ ok: true, id: deleted.id });
}
