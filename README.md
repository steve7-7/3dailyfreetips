# GoalEdge — Smarter Football Predictions

A full-stack web application for data-driven football predictions with free and premium tiers, powered by Next.js, PostgreSQL (Drizzle ORM), and Paystack payments.

## ✨ Features

### Core Features
- **Authentication** - JWT sessions in httpOnly cookies, with bcrypt password hashing
- **Predictions Board** - Full CRUD for match predictions (admin), with status tracking (upcoming/won/lost/void)
- **Free vs Premium** - Free users see blurred previews; Premium unlocks full analysis and tips
- **Paystack Integration** - Instant KSH 100 payment for 24-hour premium access (mock mode works out-of-the-box)

### Performance & Testing
- **Cache Server** - In-memory caching with stale-while-revalidate for 7-9x faster responses
- **Page Speed Tester** - Live benchmarking comparing cached vs uncached queries
- **Plan Preview Studio** - Toggle between Free/Premium/Admin views without relogging

### Infrastructure
- **PostgreSQL** via Drizzle ORM with full type safety
- **Supabase Ready** - Optional Supabase client for auth/storage (enable via env vars)
- **SEO Optimized** - Sitemap, OpenGraph, Twitter cards, meta tags

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or remote)

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Push schema to database
npx drizzle-kit push

# Seed demo data
npx tsx src/db/seed.ts

# Start development server
npm run dev
```

### Demo Accounts
| Email | Password | Plan |
|-------|----------|------|
| admin@goaledge.com | password123 | Premium Admin |
| premium@goaledge.com | password123 | Premium User |
| free@goaledge.com | password123 | Free User |

## 🔧 Configuration

### Required Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/app_db
JWT_SECRET=your-secret-key-here
```

### Optional (for production)

```env
# Live Paystack payments
PAYSTACK_SECRET_KEY=sk_live_xxx

# Supabase integration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# App URL for callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # Login, register, profile, Supabase auth
│   │   ├── predictions/  # CRUD endpoints
│   │   ├── paystack/     # Payment initialization, verification, webhook
│   │   ├── tester/       # Cache server endpoints
│   │   └── health/       # Health check
│   ├── dashboard/
│   │   ├── predictions/  # Prediction list, create, edit, detail
│   │   ├── subscription/ # Pricing and payment history
│   │   ├── profile/      # User profile management
│   │   ├── tester/       # Performance tester UI
│   │   └── layout.tsx    # Protected dashboard layout
│   ├── about/            # About page
│   ├── privacy/          # Privacy policy
│   ├── cookies/          # Cookie policy
│   ├── contact/          # Contact page
│   └── sitemap.ts        # Auto-generated sitemap
├── components/
│   ├── ui/               # Button, kit (spinner, avatar, badge)
│   ├── prediction-*.tsx    # Cards, filters, form
│   ├── dashboard-shell.tsx
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   └── toaster.tsx
├── lib/
│   ├── cache-server.ts   # In-memory caching engine
│   ├── queries.ts        # Database queries with caching
│   ├── auth.ts           # Session management
│   ├── session.ts        # JWT handling
│   ├── paystack.ts       # Paystack API integration
│   ├── supabase.ts       # Optional Supabase client
│   ├── constants.ts      # Plans, leagues, risk levels
│   └── utils.ts          # Formatting helpers
└── db/
    ├── schema.ts         # Drizzle schema (users, predictions, subscriptions)
    └── seed.ts           # Demo data seeder
```

## 💳 Payments

### Mock Mode (Default)
When `PAYSTACK_SECRET_KEY` is not set, the app simulates payments with instant fulfillment.

### Live Mode
Set `PAYSTACK_SECRET_KEY` to enable real Paystack transactions. Users will be redirected to Paystack's hosted checkout.

## 📊 Cache Server

The in-memory cache server (`src/lib/cache-server.ts`) accelerates page loads:

- **Stale-While-Revalidate**: Returns cached data while refreshing in background
- **Tag-based Invalidation**: Automatically clears related cache on mutations
- **Live Telemetry**: Check `/api/tester` for hit rates and performance stats

## 🛠️ Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npx tsx src/db/seed.ts  # Seed database
```

## 📝 License

MIT — Predictions are for informational purposes only. Please gamble responsibly.