"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { PredictionFilters } from "@/hooks/use-predictions";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

const TIERS = [
  { key: "all", label: "All tips" },
  { key: "free", label: "Free" },
  { key: "premium", label: "Premium" },
] as const;

export function PredictionFiltersBar({
  filters,
  onChange,
  count,
}: {
  filters: PredictionFilters;
  onChange: (f: PredictionFilters) => void;
  count?: number;
}) {
  const [q, setQ] = useState(filters.q ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== q) onChange({ ...filters, q });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ ...filters, status: t.key === "all" ? undefined : t.key })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                (filters.status ?? "all") === t.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={filters.tier ?? "all"}
          onChange={(e) =>
            onChange({
              ...filters,
              tier: e.target.value === "all" ? undefined : e.target.value,
            })
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        {count != null && (
          <span className="hidden text-sm text-slate-400 sm:inline">
            {count} {count === 1 ? "result" : "results"}
          </span>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team or league…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:w-64"
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                onChange({ ...filters, q: undefined });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
