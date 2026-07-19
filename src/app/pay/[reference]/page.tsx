"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toaster";
import { formatNaira } from "@/lib/utils";
import { getPaystackMode } from "@/lib/paystack";

export default function MockPayPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    amount: number;
    currency: string;
    plan: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [reference, setReference] = useState("");

  useEffect(() => {
    (async () => {
      const { reference: ref } = await params;
      setReference(ref);
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`);
        const json = await res.json();
        if (res.ok && json.subscription) {
          setData(json.subscription);
        } else {
          toast.error("Payment session not found.");
        }
      } catch {
        toast.error("Could not load payment details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  async function pay() {
    setPaying(true);
    try {
      const res = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        router.push("/dashboard/subscription?status=success");
      } else {
        toast.error(json.message || "Payment failed.");
        setPaying(false);
      }
    } catch {
      toast.error("Payment failed.");
      setPaying(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-semibold">Secure Checkout</span>
          </div>
          <p className="mt-1 text-xs text-emerald-50">
            {getPaystackMode() === "live"
              ? "Powered by Paystack"
              : "Demo checkout (Paystack mock mode)"}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : data ? (
            <>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">GoalEdge Premium</p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-700">
                  {data.plan} plan
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {formatNaira(data.amount)}
                </p>
                <p className="text-xs text-slate-400">{data.currency}</p>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <CreditCard className="h-4 w-4" />
                {data.email}
              </div>

              {getPaystackMode() === "mock" && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Demo mode: no real charge. Click pay to simulate a successful
                  transaction.
                </p>
              )}

              <Button onClick={pay} loading={paying} className="mt-5 w-full" size="lg">
                Pay {data.amount > 0 ? formatNaira(data.amount) : "now"}
              </Button>
            </>
          ) : (
            <div className="py-10 text-center">
              <Lock className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                Payment session expired
              </p>
              <Link
                href="/dashboard/subscription"
                className="mt-4 inline-block text-sm font-semibold text-emerald-600"
              >
                Back to subscription
              </Link>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3 w-3" />
            256-bit encrypted · PCI-DSS compliant
          </div>
        </div>
      </div>
    </main>
  );
}
