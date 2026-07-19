/**
 * GoalEdge High-Performance Cache Server
 * Accelerates page rendering and API response times by serving frequent database queries
 * from sub-millisecond memory with stale-while-revalidate background refresh.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
  tags: string[];
}

interface CacheTelemetry {
  hits: number;
  misses: number;
  keysCount: number;
  totalSavedMs: number;
  lastClearedAt: Date | null;
}

class CacheServer {
  private store = new Map<string, CacheEntry<unknown>>();
  private ongoingFetches = new Map<string, Promise<unknown>>();
  private telemetry: CacheTelemetry = {
    hits: 0,
    misses: 0,
    keysCount: 0,
    totalSavedMs: 0,
    lastClearedAt: null,
  };

  /**
   * Fetch data with caching. If cached and valid, returns immediately.
   * If expired within SWR window, returns stale while revalidating in background.
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttlMs?: number; tags?: string[]; simulatedDbLatencyMs?: number } = {},
  ): Promise<T> {
    const ttlMs = options.ttlMs ?? 30_000; // default 30s
    const tags = options.tags ?? [];
    const simulatedLat = options.simulatedDbLatencyMs ?? 18;
    const now = Date.now();
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    // Cache Hit (Fresh)
    if (entry && now - entry.timestamp <= entry.ttl) {
      this.telemetry.hits++;
      this.telemetry.totalSavedMs += simulatedLat;
      return entry.data;
    }

    // Cache Hit (Stale - return stale while revalidating in background)
    if (entry && now - entry.timestamp <= entry.ttl * 2) {
      this.telemetry.hits++;
      this.telemetry.totalSavedMs += simulatedLat;
      // Revalidate in background without blocking return
      if (!this.ongoingFetches.has(key)) {
        const fetchPromise = fetcher()
          .then((freshData) => {
            this.set(key, freshData, ttlMs, tags);
            this.ongoingFetches.delete(key);
            return freshData;
          })
          .catch(() => {
            this.ongoingFetches.delete(key);
          });
        this.ongoingFetches.set(key, fetchPromise);
      }
      return entry.data;
    }

    // Cache Miss or Expired beyond SWR window - deduplicate simultaneous requests
    this.telemetry.misses++;
    if (this.ongoingFetches.has(key)) {
      return this.ongoingFetches.get(key) as Promise<T>;
    }

    const startTime = performance.now();
    const fetchPromise = fetcher()
      .then((data) => {
        this.set(key, data, ttlMs, tags);
        this.ongoingFetches.delete(key);
        return data;
      })
      .catch((err) => {
        this.ongoingFetches.delete(key);
        throw err;
      });

    this.ongoingFetches.set(key, fetchPromise);
    return fetchPromise as Promise<T>;
  }

  set<T>(key: string, data: T, ttlMs = 30_000, tags: string[] = []): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      tags,
    });
    this.telemetry.keysCount = this.store.size;
  }

  /**
   * Invalidate all cache items matching any of the provided tags or specific key
   */
  invalidate(tagsOrKey: string | string[]): number {
    const targets = Array.isArray(tagsOrKey) ? tagsOrKey : [tagsOrKey];
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (targets.includes(key) || entry.tags.some((tag) => targets.includes(tag))) {
        this.store.delete(key);
        removed++;
      }
    }
    this.telemetry.keysCount = this.store.size;
    return removed;
  }

  purgeAll(): void {
    this.store.clear();
    this.ongoingFetches.clear();
    this.telemetry.keysCount = 0;
    this.telemetry.lastClearedAt = new Date();
  }

  getStats(): CacheTelemetry & { hitRate: number; storeEntries: { key: string; tags: string[]; ageMs: number }[] } {
    const total = this.telemetry.hits + this.telemetry.misses;
    const hitRate = total > 0 ? Math.round((this.telemetry.hits / total) * 100) : 0;
    const now = Date.now();
    const storeEntries: { key: string; tags: string[]; ageMs: number }[] = [];

    for (const [key, entry] of this.store.entries()) {
      storeEntries.push({
        key,
        tags: entry.tags,
        ageMs: now - entry.timestamp,
      });
    }

    return {
      ...this.telemetry,
      hitRate,
      storeEntries,
    };
  }
}

// Global singleton across hot reloads in Next.js
const globalForCache = globalThis as unknown as { __goalEdgeCacheServer?: CacheServer };
export const cacheServer = globalForCache.__goalEdgeCacheServer ?? new CacheServer();

if (process.env.NODE_ENV !== "production") {
  globalForCache.__goalEdgeCacheServer = cacheServer;
}
