"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { ClientPrediction } from "@/lib/types";
import type { PredictionInput, PredictionPatch } from "@/lib/validation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json() as Promise<{ predictions: ClientPrediction[] }>;
};

export interface PredictionFilters {
  status?: string;
  tier?: string;
  q?: string;
}

function buildKey(filters: PredictionFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.q) params.set("q", filters.q);
  return `/api/predictions?${params.toString()}`;
}

const JSON_HEADERS = { "content-type": "application/json" };

export function usePredictions(
  filters: PredictionFilters,
  initial?: ClientPrediction[],
) {
  const key = buildKey(filters);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    fetcher,
    {
      fallbackData: initial ? { predictions: initial } : undefined,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const predictions = data?.predictions ?? [];

  const createPrediction = useCallback(
    async (input: PredictionInput) => {
      try {
        await mutate(
          async (prev) => {
            const res = await fetch("/api/predictions", {
              method: "POST",
              headers: JSON_HEADERS,
              body: JSON.stringify(input),
            });
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              throw new Error(b.error || "Could not create prediction");
            }
            const { prediction } = await res.json();
            return { predictions: [prediction, ...(prev?.predictions ?? [])] };
          },
          {
            optimisticData: (prev) => ({
              predictions: [
                { ...(input as unknown as ClientPrediction), id: -Date.now() },
                ...(prev?.predictions ?? []),
              ],
            }),
            rollbackOnError: true,
            revalidate: false,
          },
        );
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: (e as Error).message };
      }
    },
    [mutate],
  );

  const updatePrediction = useCallback(
    async (id: number, patch: PredictionPatch) => {
      try {
        await mutate(
          async (prev) => {
            const res = await fetch(`/api/predictions/${id}`, {
              method: "PATCH",
              headers: JSON_HEADERS,
              body: JSON.stringify(patch),
            });
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              throw new Error(b.error || "Could not update prediction");
            }
            const { prediction } = await res.json();
            return {
              predictions: (prev?.predictions ?? []).map((p) =>
                p.id === id ? prediction : p,
              ),
            };
          },
          {
            optimisticData: (prev) => ({
              predictions: (prev?.predictions ?? []).map((p) =>
                p.id === id ? ({ ...p, ...patch } as ClientPrediction) : p,
              ),
            }),
            rollbackOnError: true,
            revalidate: false,
          },
        );
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: (e as Error).message };
      }
    },
    [mutate],
  );

  const deletePrediction = useCallback(
    async (id: number) => {
      try {
        await mutate(
          async (prev) => {
            const res = await fetch(`/api/predictions/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const b = await res.json().catch(() => ({}));
              throw new Error(b.error || "Could not delete prediction");
            }
            return {
              predictions: (prev?.predictions ?? []).filter(
                (p) => p.id !== id,
              ),
            };
          },
          {
            optimisticData: (prev) => ({
              predictions: (prev?.predictions ?? []).filter(
                (p) => p.id !== id,
              ),
            }),
            rollbackOnError: true,
            revalidate: false,
          },
        );
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: (e as Error).message };
      }
    },
    [mutate],
  );

  return {
    predictions,
    isLoading,
    isValidating,
    error,
    createPrediction,
    updatePrediction,
    deletePrediction,
    mutate,
  };
}
