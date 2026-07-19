"use client";

import Link from "next/link";
import {
  Clock,
  Lock,
  Crown,
  Pencil,
  Trash2,
  ChevronRight,
  Target,
} from "lucide-react";
import type { ClientPrediction } from "@/lib/types";
import { STATUS_CONFIG, type StatusKey } from "@/lib/constants";
import { cn, formatDateTime, timeUntil, isPast } from "@/lib/utils";
import { ConfidenceBar } from "./confidence-bar";
import { Badge } from "./ui/kit";

export function PredictionCard({
  prediction,
  isAdmin = false,
  onDelete,
}: {
  prediction: ClientPrediction;
  isAdmin?: boolean;
  onDelete?: (id: number) => void;
}) {
  const p = prediction;
  const status = p.status as StatusKey;
  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming;
  const locked = p.locked;
  const started = isPast(p.kickoffAt);
  const hasScore = p.scoreHome != null && p.scoreAway != null;

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg leading-none">{p.leagueIcon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">
              {p.league}
            </p>
            <p className="text-xs text-slate-400">{p.country}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {p.isPremium && (
            <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          )}
          <Badge className={sc.badge}>
            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
            {sc.label}
          </Badge>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-base font-bold leading-snug text-slate-900">
          {p.homeTeam}{" "}
          <span className="mx-1 text-sm font-medium text-slate-300">vs</span>{" "}
          {p.awayTeam}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(p.kickoffAt)}
          </span>
          {hasScore ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
              FT {p.scoreHome}–{p.scoreAway}
            </span>
          ) : !started ? (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-600">
              in {timeUntil(p.kickoffAt)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        <div className={cn(locked && "select-none blur-[4px]")}>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Target className="h-3.5 w-3.5" />
            {p.market}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">{p.tip}</p>
            <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-sm font-bold text-emerald-600 ring-1 ring-slate-200">
              {p.odds.toFixed(2)}
            </span>
          </div>
        </div>
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/70">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Lock className="h-4 w-4" />
            </span>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <Crown className="h-3.5 w-3.5" />
              Unlock with Premium
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ConfidenceBar value={p.confidence} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs font-medium text-slate-400">
          by {p.tipster}
        </span>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Link
                href={`/dashboard/predictions/${p.id}/edit`}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              {onDelete && (
                <button
                  onClick={() => onDelete(p.id)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
          {!locked && (
            <Link
              href={`/dashboard/predictions/${p.id}`}
              className="ml-1 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              View
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
