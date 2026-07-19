import { z } from "zod";

export const predictionInputSchema = z.object({
  homeTeam: z.string().trim().min(2, "Home team is required"),
  awayTeam: z.string().trim().min(2, "Away team is required"),
  league: z.string().trim().min(1, "League is required"),
  leagueIcon: z.string().max(8).default("⚽"),
  country: z.string().default("International"),
  kickoffAt: z.string().min(1, "Kickoff time is required"),
  tip: z.string().trim().min(2, "Prediction tip is required"),
  market: z.enum([
    "Match Result",
    "Over/Under",
    "Both Teams to Score",
    "Double Chance",
    "Correct Score",
    "Goals",
    "Corners",
    "Cards",
  ]),
  odds: z.coerce.number().min(1.01, "Odds must be greater than 1"),
  confidence: z.coerce.number().int().min(0).max(100),
  risk: z.enum(["low", "medium", "high"]),
  analysis: z.string().default(""),
  isPremium: z.boolean().default(false),
  status: z.enum(["upcoming", "won", "lost", "void"]).default("upcoming"),
  scoreHome: z.number().int().nullable().optional(),
  scoreAway: z.number().int().nullable().optional(),
  tipster: z.string().default("Arena Tipster"),
});

export const predictionPatchSchema = predictionInputSchema.partial();

export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type PredictionPatch = z.infer<typeof predictionPatchSchema>;
