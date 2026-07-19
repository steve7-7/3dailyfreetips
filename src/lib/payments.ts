import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPayment } from "./paystack";
import { PLANS, type PlanId } from "./constants";
import { cacheServer } from "./cache-server";

export interface FulfillmentResult {
  ok: boolean;
  status: "success" | "failed" | "pending";
  message: string;
  already?: boolean;
  plan?: string;
}

export async function fulfillPayment(reference: string): Promise<FulfillmentResult> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.reference, reference))
    .limit(1);

  if (!sub) {
    return { ok: false, status: "failed", message: "Reference not found" };
  }
  if (sub.status === "success") {
    return {
      ok: true,
      status: "success",
      already: true,
      message: "Subscription already active",
      plan: sub.plan,
    };
  }

  const result = await verifyPayment(reference);

  if (result.status === "success") {
    const plan = PLANS[sub.plan as PlanId];
    const expires = plan?.durationHours
      ? new Date(Date.now() + plan.durationHours * 60 * 60 * 1000)
      : null;

    await db
      .update(subscriptions)
      .set({ status: "success", paidAt: new Date() })
      .where(eq(subscriptions.reference, reference));

    await db
      .update(users)
      .set({ plan: "premium", planExpiresAt: expires })
      .where(eq(users.id, sub.userId));

    cacheServer.invalidate(["stats", "predictions"]);

    return {
      ok: true,
      status: "success",
      message: "Payment successful — premium unlocked",
      plan: sub.plan,
    };
  }

  if (result.status === "failed") {
    await db
      .update(subscriptions)
      .set({ status: "failed" })
      .where(eq(subscriptions.reference, reference));
    return { ok: false, status: "failed", message: result.gatewayResponse };
  }

  return { ok: false, status: "pending", message: "Payment verification pending" };
}
