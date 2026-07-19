"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { Prediction } from "@/db/schema";
import type { PredictionInput } from "@/lib/validation";
import { LEAGUES, MARKETS, RISK_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

function toLocalInput(iso?: string | Date | null) {
  const d = iso ? new Date(iso) : new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}

interface FormState {
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueIcon: string;
  country: string;
  kickoffAt: string;
  tip: string;
  market: string;
  odds: string;
  confidence: number;
  risk: string;
  analysis: string;
  isPremium: boolean;
  status: string;
  scoreHome: string;
  scoreAway: string;
  tipster: string;
}

export function PredictionForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = "Save prediction",
}: {
  initial?: Prediction;
  onSubmit: (values: PredictionInput) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<FormState>({
    homeTeam: initial?.homeTeam ?? "",
    awayTeam: initial?.awayTeam ?? "",
    league: initial?.league ?? "",
    leagueIcon: initial?.leagueIcon ?? "⚽",
    country: initial?.country ?? "International",
    kickoffAt: toLocalInput(initial?.kickoffAt),
    tip: initial?.tip ?? "",
    market: initial?.market ?? "Match Result",
    odds: initial ? String(initial.odds) : "",
    confidence: initial?.confidence ?? 75,
    risk: initial?.risk ?? "medium",
    analysis: initial?.analysis ?? "",
    isPremium: initial?.isPremium ?? false,
    status: initial?.status ?? "upcoming",
    scoreHome: initial?.scoreHome != null ? String(initial.scoreHome) : "",
    scoreAway: initial?.scoreAway != null ? String(initial.scoreAway) : "",
    tipster: initial?.tipster ?? "Arena Tipster",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleLeague(name: string) {
    const found = LEAGUES.find((l) => l.name === name);
    setForm((f) => ({
      ...f,
      league: name,
      leagueIcon: found?.icon ?? f.leagueIcon,
      country: found?.country ?? f.country,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.homeTeam.trim().length < 2) errs.homeTeam = "Required";
    if (form.awayTeam.trim().length < 2) errs.awayTeam = "Required";
    if (!form.league.trim()) errs.league = "Required";
    if (!form.kickoffAt) errs.kickoffAt = "Required";
    if (form.tip.trim().length < 2) errs.tip = "Required";
    const oddsNum = Number(form.odds);
    if (!form.odds || oddsNum < 1.01) errs.odds = "Must be > 1.00";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const settled = form.status !== "upcoming";
    const values: PredictionInput = {
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      league: form.league.trim(),
      leagueIcon: form.leagueIcon || "⚽",
      country: form.country.trim() || "International",
      kickoffAt: new Date(form.kickoffAt).toISOString(),
      tip: form.tip.trim(),
      market: form.market as PredictionInput["market"],
      odds: oddsNum,
      confidence: Number(form.confidence),
      risk: form.risk as PredictionInput["risk"],
      analysis: form.analysis.trim(),
      isPremium: form.isPremium,
      status: form.status as PredictionInput["status"],
      scoreHome: settled && form.scoreHome !== "" ? Number(form.scoreHome) : null,
      scoreAway: settled && form.scoreAway !== "" ? Number(form.scoreAway) : null,
      tipster: form.tipster.trim() || "Arena Tipster",
    };
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Match details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Home team" error={errors.homeTeam}>
            <input
              className={inputCls}
              value={form.homeTeam}
              onChange={(e) => set("homeTeam", e.target.value)}
              placeholder="e.g. Manchester City"
            />
          </Field>
          <Field label="Away team" error={errors.awayTeam}>
            <input
              className={inputCls}
              value={form.awayTeam}
              onChange={(e) => set("awayTeam", e.target.value)}
              placeholder="e.g. Arsenal"
            />
          </Field>
          <Field label="League">
            <input
              className={inputCls}
              list="leagues"
              value={form.league}
              onChange={(e) => handleLeague(e.target.value)}
              placeholder="Select or type a league"
            />
            <datalist id="leagues">
              {LEAGUES.map((l) => (
                <option key={l.name} value={l.name} />
              ))}
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country">
              <input
                className={inputCls}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </Field>
            <Field label="Icon">
              <input
                className={inputCls}
                value={form.leagueIcon}
                onChange={(e) => set("leagueIcon", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Kickoff time" error={errors.kickoffAt}>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.kickoffAt}
              onChange={(e) => set("kickoffAt", e.target.value)}
            />
          </Field>
          <Field label="Tipster">
            <input
              className={inputCls}
              value={form.tipster}
              onChange={(e) => set("tipster", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Prediction
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tip / selection" error={errors.tip}>
            <input
              className={inputCls}
              value={form.tip}
              onChange={(e) => set("tip", e.target.value)}
              placeholder="e.g. Over 2.5 Goals"
            />
          </Field>
          <Field label="Market">
            <select
              className={inputCls}
              value={form.market}
              onChange={(e) => set("market", e.target.value)}
            >
              {MARKETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Odds" error={errors.odds}>
            <input
              type="number"
              step="0.01"
              min="1.01"
              className={inputCls}
              value={form.odds}
              onChange={(e) => set("odds", e.target.value)}
              placeholder="1.75"
            />
          </Field>
          <Field label="Risk level">
            <select
              className={inputCls}
              value={form.risk}
              onChange={(e) => set("risk", e.target.value)}
            >
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r[0]!.toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className={labelCls}>Confidence</span>
            <span className="text-sm font-bold text-emerald-600">
              {form.confidence}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={form.confidence}
            onChange={(e) => set("confidence", Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        <div className="mt-4">
          <Field label="Analysis / reasoning">
            <textarea
              rows={4}
              className={cn(inputCls, "h-auto py-2.5")}
              value={form.analysis}
              onChange={(e) => set("analysis", e.target.value)}
              placeholder="Share the rationale behind this pick (form, H2H, injuries, xG…)"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Status &amp; access
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="upcoming">Upcoming</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="void">Void</option>
            </select>
          </Field>
          {form.status !== "upcoming" && (
            <>
              <Field label="Home score">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.scoreHome}
                  onChange={(e) => set("scoreHome", e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Away score">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.scoreAway}
                  onChange={(e) => set("scoreAway", e.target.value)}
                  placeholder="0"
                />
              </Field>
            </>
          )}
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <input
            type="checkbox"
            checked={form.isPremium}
            onChange={(e) => set("isPremium", e.target.checked)}
            className="h-4 w-4 rounded accent-emerald-500"
          />
          <span className="text-sm font-medium text-slate-700">
            Premium-only tip{" "}
            <span className="text-slate-400">
              (free members see a blurred preview)
            </span>
          </span>
        </label>
      </section>

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/predictions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to predictions
        </Link>
        <Button type="submit" loading={submitting}>
          <Save className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
