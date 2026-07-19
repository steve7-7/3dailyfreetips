import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  real,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["user", "admin"]);
export const planEnum = pgEnum("user_plan", ["free", "premium"]);
export const statusEnum = pgEnum("prediction_status", [
  "upcoming",
  "won",
  "lost",
  "void",
]);
export const riskEnum = pgEnum("prediction_risk", ["low", "medium", "high"]);
export const marketEnum = pgEnum("prediction_market", [
  "Match Result",
  "Over/Under",
  "Both Teams to Score",
  "Double Chance",
  "Correct Score",
  "Goals",
  "Corners",
  "Cards",
]);
export const subStatusEnum = pgEnum("sub_status", [
  "initialized",
  "success",
  "failed",
  "abandoned",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").default("user").notNull(),
    plan: planEnum("plan").default("free").notNull(),
    avatarColor: text("avatar_color").default("#10b981").notNull(),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  league: text("league").notNull(),
  leagueIcon: text("league_icon").default("⚽").notNull(),
  country: text("country").default("International").notNull(),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
  tip: text("tip").notNull(),
  market: marketEnum("market").default("Match Result").notNull(),
  odds: real("odds").notNull(),
  confidence: integer("confidence").default(75).notNull(),
  risk: riskEnum("risk").default("medium").notNull(),
  analysis: text("analysis"),
  isPremium: boolean("is_premium").default(false).notNull(),
  status: statusEnum("status").default("upcoming").notNull(),
  scoreHome: integer("score_home"),
  scoreAway: integer("score_away"),
  tipster: text("tipster").default("Arena Tipster").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  email: text("email"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("NGN").notNull(),
  plan: text("plan").notNull(),
  status: subStatusEnum("status").default("initialized").notNull(),
  provider: text("provider").default("paystack").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;
