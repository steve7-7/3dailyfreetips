import { db } from "@/db";
import { predictions, type Prediction, type SafeUser } from "@/db/schema";
import { sql, eq, and, count, avg } from "drizzle-orm";
import type { ClientPrediction } from "./types";
import type { PredictionFilters } from "@/hooks/use-predictions";
import { cacheServer } from "./cache-server";

export function decorate(row: Prediction, isPremium: boolean): ClientPrediction {
  const locked = row.isPremium && !isPremium;
  return { ...row, locked, analysis: locked ? null : row.analysis };
}

type StatusFilter = "upcoming" | "won" | "lost" | "void";

export async function listPredictions(
  filters: PredictionFilters = {},
  isPremium = false,
  limit = 0,
): Promise<ClientPrediction[]> {
  const cacheKey = `listPredictions:${JSON.stringify(filters)}:limit=${limit}`;

  // Fetch raw database rows through cache server (accelerated)
  const rows = await cacheServer.fetch(
    cacheKey,
    async () => {
      const conditions = [];
      if (
        filters.status === "upcoming" ||
        filters.status === "won" ||
        filters.status === "lost" ||
        filters.status === "void"
      ) {
        conditions.push(eq(predictions.status, filters.status as StatusFilter));
      }
      if (filters.tier === "premium") conditions.push(eq(predictions.isPremium, true));
      if (filters.tier === "free") conditions.push(eq(predictions.isPremium, false));
      if (filters.q) {
        conditions.push(
          sql`(${predictions.homeTeam} || ' v ' || ${predictions.awayTeam} || ' ' || ${predictions.league}) ILIKE ${`%${filters.q}%`}`,
        );
      }

      const queryRows = await db
        .select()
        .from(predictions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(
          sql`case when ${predictions.status} = 'upcoming' then 0 else 1 end`,
          predictions.kickoffAt,
        );

      return limit > 0 ? queryRows.slice(0, limit) : queryRows;
    },
    { ttlMs: 15_000, tags: ["predictions"], simulatedDbLatencyMs: 24 },
  );

  return rows.map((r) => decorate(r, isPremium));
}

export async function getPredictionById(
  id: number,
  isPremium = false,
): Promise<ClientPrediction | null> {
  const cacheKey = `predictionById:${id}`;
  const row = await cacheServer.fetch(
    cacheKey,
    async () => {
      const [dbRow] = await db
        .select()
        .from(predictions)
        .where(eq(predictions.id, id))
        .limit(1);
      return dbRow ?? null;
    },
    { ttlMs: 30_000, tags: ["predictions", `prediction:${id}`], simulatedDbLatencyMs: 15 },
  );

  return row ? decorate(row, isPremium) : null;
}

export interface DashboardStats {
  total: number;
  upcoming: number;
  won: number;
  lost: number;
  settled: number;
  winRate: number;
  premium: number;
}

export async function getStats(): Promise<DashboardStats> {
  return cacheServer.fetch(
    "dashboardStats",
    async () => {
      const grouped = await db
        .select({ status: predictions.status, count: count() })
        .from(predictions)
        .groupBy(predictions.status);

      const map: Record<string, number> = {};
      for (const r of grouped) map[r.status] = Number(r.count);

      const won = map["won"] ?? 0;
      const lost = map["lost"] ?? 0;
      const upcoming = map["upcoming"] ?? 0;
      const settled = won + lost;
      const total = Object.values(map).reduce((a, b) => a + b, 0);

      const premiumRows = await db
        .select({ c: count() })
        .from(predictions)
        .where(eq(predictions.isPremium, true));

      return {
        total,
        upcoming,
        won,
        lost,
        settled,
        winRate: settled ? Math.round((won / settled) * 100) : 0,
        premium: Number(premiumRows[0]?.c ?? 0),
      };
    },
    { ttlMs: 20_000, tags: ["stats", "predictions"], simulatedDbLatencyMs: 32 },
  );
}

export function invalidatePredictionCache(): void {
  cacheServer.invalidate(["predictions", "stats"]);
}

export function isPremiumUser(user?: SafeUser | null) {
  return user?.plan === "premium" || user?.role === "admin";
}

/**
 * Predictions Utility Functions
 * Enhanced helpers for bulk operations, CSV export, and advanced analytics.
 */
export async function getPredictionsByLeague(
  league: string,
  isPremium = false,
): Promise<ClientPrediction[]> {
  return listPredictions({ q: league }, isPremium);
}

export async function getPerformanceStats(): Promise<{
  total: number;
  won: number;
  lost: number;
  void: number;
  upcoming: number;
  winRate: number;
  avgOdds: number;
}> {
  const [stats, avgOddsRow] = await Promise.all([
    getStats(),
    db.select({ avgOdds: sql<number>`round(avg(odds), 2)` }).from(predictions),
  ]);

  return {
    total: stats.total,
    won: stats.won,
    lost: stats.lost,
    void: 0, // Would need to query void count
    upcoming: stats.upcoming,
    winRate: stats.winRate,
    avgOdds: Number(avgOddsRow[0]?.avgOdds ?? 0),
  };
}

export async function exportPredictionsCSV(
  filters: PredictionFilters = {},
  isPremium = false,
): Promise<string> {
  const preds = await listPredictions(filters, isPremium);
  const header = "homeTeam,awayTeam,league,tip,odds,confidence,risk,status,kickoffAt\n";
  const rows = preds
    .map((p) =>
      [p.homeTeam, p.awayTeam, p.league, p.tip, p.odds, p.confidence, p.risk, p.status, p.kickoffAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return header + rows;
}
