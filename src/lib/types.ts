import type { Prediction } from "@/db/schema";

export type ClientPrediction = Prediction & { locked: boolean };
