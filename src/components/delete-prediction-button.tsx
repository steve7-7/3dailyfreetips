"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { usePredictions } from "@/hooks/use-predictions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toaster";

export function DeletePredictionButton({ id }: { id: number }) {
  const router = useRouter();
  const { deletePrediction } = usePredictions({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    setLoading(true);
    const res = await deletePrediction(id);
    setLoading(false);
    if (res.ok) {
      toast.success("Prediction deleted.");
      router.push("/dashboard/predictions");
      router.refresh();
    } else {
      setOpen(false);
      toast.error(res.error || "Could not delete prediction.");
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete prediction?"
        message="This will permanently remove the tip. This action cannot be undone."
        confirmLabel="Delete"
        loading={loading}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
