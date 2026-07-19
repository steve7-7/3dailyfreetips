"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toaster";

export function UpgradeButton({
  planId,
  label,
  disabled,
}: {
  planId: "premium";
  label: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setLoading(false);
      toast.error((e as Error).message);
    }
  }

  return (
    <Button onClick={pay} loading={loading} disabled={disabled} className="w-full">
      {label}
    </Button>
  );
}
