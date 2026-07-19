import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Optional Supabase client.
 *
 * The platform persists data in the local PostgreSQL instance (Supabase is
 * fully Postgres-compatible, so the Drizzle schema maps 1:1 to a Supabase
 * project). This client is wired up so the app can talk to a hosted Supabase
 * project for things like auth or file storage the moment credentials are
 * provided via NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * It is created lazily and never throws when credentials are missing, so the
 * app keeps working in environments without Supabase configured.
 */
let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

/**
 * Supabase Authentication Integration
 * Provides optional Supabase-based user authentication alongside our local JWT system.
 */
export async function supabaseSignIn(
  email: string,
  password: string,
): Promise<{ user: { id: string; email: string; name?: string } | null; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: "Supabase not configured" };
  }
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return {
    user: {
      id: data.user?.id ?? "",
      email: data.user?.email ?? "",
      name: data.user?.user_metadata?.name,
    },
  };
}

export async function supabaseSignUp(
  email: string,
  password: string,
  name?: string,
): Promise<{ user: { id: string; email: string } | null; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, error: "Supabase not configured" };
  }
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { user: null, error: error.message };
  return {
    user: {
      id: data.user?.id ?? "",
      email: data.user?.email ?? "",
    },
  };
}

/**
 * Supabase-enhanced Predictions Functions
 * These helpers allow the app to optionally sync predictions to Supabase storage
 * when configured, enabling real-time updates across multiple instances.
 */
export async function syncPredictionToSupabase(
  prediction: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    tip: string;
    odds: number;
    status: string;
  },
): Promise<void> {
  const client = getSupabase();
  if (!client) return; // Silent no-op when Supabase not configured

  try {
    await client.from("predictions").insert({
      home_team: prediction.homeTeam,
      away_team: prediction.awayTeam,
      league: prediction.league,
      tip: prediction.tip,
      odds: prediction.odds,
      status: prediction.status,
    });
  } catch {
    // Silent fail for non-critical sync
  }
}

export async function broadcastPredictionUpdate(
  event: "created" | "updated" | "deleted",
  predictionId: number,
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.channel("predictions").send({
      type: "broadcast",
      event,
      payload: { predictionId },
    });
  } catch {
    // Silent fail
  }
}
