# Caddi

An AI golf coach that remembers. Caddi logs rounds and practice sessions over
time and gives feedback grounded in patterns across your history — not generic
golf tips. See `PRD.md` for the product spec and `AGENTS.md` for build
context, principles, and design tokens.

## Stack

- **App:** React Native via Expo (managed workflow), TypeScript
- **Navigation:** React Navigation — bottom tabs (Home / Log / Insights / Practice)
- **Styling:** NativeWind (Tailwind for RN) with fixed brand tokens
- **Backend:** Supabase (auth, Postgres, Edge Functions)
- **Local-first:** expo-sqlite write path + background sync to Supabase
- **AI:** Claude API, called only from Supabase Edge Functions
- **Releases:** EAS Build + EAS Submit

## Getting started

```bash
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npx expo start
```

Run on a device with Expo Go, or `npx expo run:ios` / `run:android` for a dev build.

## Backend setup

1. Create a Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql` (SQL editor or `supabase db push`).
3. Put the project URL and anon key in `.env`.

Edge Functions for AI feedback live in `supabase/functions/` (see its README).

## Project layout

```
App.tsx                  entry: fonts, auth provider, sync listener, navigation
src/
  navigation/            bottom tabs + Log stack (start round / hole logger / summary)
  screens/               Home, auth, log flow, Insights (trend view), Practice
  components/            Stepper, ChipGroup, Button, CoachCard, TrendLine
  contexts/              AuthContext (Supabase session, local-only fallback)
  lib/
    supabase.ts          Supabase client (AsyncStorage-backed auth)
    db/                  local SQLite schema — the offline-first write path
    repo/                rounds/holes, practice sessions, local stat series
    sync/                background push of pending rows to Supabase
    ai/                  client for the insight Edge Functions
  theme/tokens.ts        brand colors + fonts (source of truth outside Tailwind)
  types/models.ts        domain types mirroring the DB schema
supabase/
  migrations/            Postgres schema (RLS included)
  functions/             Edge Functions — the ONLY place Claude API is called
    generate-round-summary/   post-round summary (history once 3+ rounds exist)
    generate-insight/         multi-round trend read (hard 3-round gate)
```

Deploy the Edge Functions with `supabase functions deploy <name>` and set the
API key once with `supabase secrets set ANTHROPIC_API_KEY=...`.
