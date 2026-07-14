# CLAUDE.md — Caddi

Context for any Claude (or Claude Code) session working on this codebase. Read this before making product or design decisions, not just before writing code.

> Expo note: this project uses Expo SDK 57. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo-specific code.

## What Caddi is

An AI golf coach app. The core differentiator is **memory**: it logs practices and rounds over time and gives feedback that references patterns across sessions, not just the latest one. Full product reasoning lives in `PRD.md` in this repo — read it if a decision isn't covered here.

If you're ever unsure whether a feature belongs in this app, ask: **does this get meaningfully better because we remember history, or would it work identically as a one-off?** If the latter, it's probably not core to Caddi, or at minimum shouldn't be prioritized over something that is.

## Non-negotiable product principles

1. **Never build isolated, memoryless features when a history-aware version is possible.** If you're implementing AI feedback, round summaries, or insights, the prompt/context MUST include relevant prior rounds and practice sessions — not just the current entry. A "coach" response that could have been written without seeing history is a bug, not a feature.
2. **Logging friction kills this product.** Any change to the round or practice logging flow should be evaluated against: can this still be completed in under a minute? Default to fewer required fields, bigger tap targets, sensible defaults — never add a required field without a strong reason.
3. **No real-time / on-course features in this phase.** GPS, live shot advice, club recommendation while playing — all explicitly out of scope for now (see PRD section 9). Don't scope-creep toward "AI caddy" features without an explicit decision to do so; it's a considered v2+ direction, not an oversight.
4. **AI feedback must cite the specific pattern behind it.** Never write or generate feedback copy that's generic golf advice. Every insight should be traceable to specific rounds/sessions in the data (e.g., "3rd round in a row with GIR under 30%," "since you started logging short game practice in May"). If the underlying data can't support a specific claim, say less — don't pad with generic tips.

## Tech stack

Caddi is a **native mobile app** (iOS + Android) — not a web app. This shapes a lot of decisions below; don't default to web patterns (routes-as-URLs, hover states, browser storage) anywhere in the codebase.

- **Frontend:** React Native via Expo (managed workflow) — keeps a single codebase for iOS and Android and stays close to Christian's existing React fluency
- **Navigation:** React Navigation (bottom tab navigator for Home / Log / Insights / Practice, matching the IA already designed)
- **Styling:** NativeWind (Tailwind syntax for React Native) — keeps the utility-class workflow, output must still hit the exact design tokens below
- **Backend / DB:** Supabase (unchanged — auth, Postgres, storage)
- **Local storage / offline cache:** required, not optional — see Mobile considerations below
- **Build / distribution:** EAS Build + EAS Submit (Expo Application Services) for App Store and Play Store releases. No Vercel — there's no web deployment target unless a separate marketing/landing page is explicitly scoped later, and if so, that's a distinct lightweight project, not this app's codebase.
- **AI:** Claude API (Anthropic) for feedback generation, insight generation, and practice recommendations — called from a thin backend layer (Supabase Edge Functions), never directly from the client, so API keys never ship in the app bundle

Consolidate on this stack rather than introducing new tools. The philosophy going into this build is depth over switching — offline sync, native feel, and better prompt/context design are the interesting problems here, not tool selection.

## Mobile-specific considerations

- **Offline-first logging is a requirement, not a nice-to-have.** Golf courses routinely have poor or no signal. A user standing on hole 12 with one bar cannot lose a logged hole. Round and practice logging must write to local storage first and sync to Supabase when connectivity returns — never block the logging UI on a network call.
- **Native feel matters as much as brand.** Steppers, chips, and toggles should use native gesture handling and haptics (light haptic feedback on score/putt stepper taps) — this is what makes fast logging actually feel fast, not just look fast.
- **Respect safe areas and platform conventions** (notch/home indicator, iOS vs. Android back behavior, system font scaling for accessibility) rather than fighting the platform.
- **In-app purchase, not Stripe, for the paid tier.** Apple and Google require subscriptions for digital features to go through their in-app purchase systems (App Store/Play Billing) in almost all cases — plan the freemium gate around RevenueCat or native IAP APIs, not a web checkout flow. This has margin implications (platform fee, typically up to 30%, often lower after year one or under small-business programs) worth factoring into pricing decisions.

## Data model

```sql
users (
  id, email, created_at
)

rounds (
  id, user_id, date, course_name, total_score, total_putts, created_at
)

holes (
  id, round_id, hole_number, par, score, putts,
  fairway_hit (enum: hit / missed / n_a),
  gir (boolean),
  penalties (int)
)

practice_sessions (
  id, user_id, date, focus_area, duration_minutes,
  feel (enum: rough / solid / breakthrough),
  notes (text), created_at
)

ai_insights (
  id, user_id, generated_at, summary (text), recommendation (text),
  based_on_round_ids (uuid[]), based_on_practice_ids (uuid[])
)
```

`ai_insights.based_on_*` fields are required, not optional — every generated insight must record what data it was grounded in. This is what makes "coach with memory" auditable and debuggable, and it's the foundation for any future "why did you say that?" UI.

## AI prompt design guidelines

When building any Claude API call for feedback, insights, or recommendations:

- **Always pass relevant history, not just the triggering event.** Pull the last several rounds and practice sessions (structured, not full raw dumps) and include them in context.
- **Prompt for specificity over completeness.** The model should surface one clear, well-evidenced pattern rather than a comprehensive list of observations. Coaches say one true thing well, not five things vaguely.
- **Require the model to reference *why*.** Feedback copy should read like "your X has done Y since Z" — grounded in the actual logged data, never generic instruction content a golfer could get anywhere.
- **Gate trend-level claims behind a data minimum.** Don't let the model assert a "pattern" off a single data point. Working assumption from the PRD: 3+ rounds minimum before surfacing trend claims — enforce this in the prompt/context construction, not just via instruction.
- **Keep structured logs as the primary context, freeform notes as flavor.** Practice notes and round context are useful color, but the model's core claims should be traceable to structured fields (scores, putts, GIR, focus areas) so they stay auditable.

## Brand and design tokens

Established design direction — treat these as fixed unless a deliberate design decision changes them, not defaults to improvise around:

**Color**
- Cream (base/background): `#F7F4EC`
- Cream deep (secondary surface): `#F0EBDD`
- Ink (primary text): `#20261F`
- Ink soft (secondary text): `#4B5248`
- Pine (primary/signature color): `#2C4A34`
- Pine deep (hover/pressed): `#1D3324`
- Sage (card/surface fill): `#E1E3D2`
- Sage line (borders): `#C9CDB4`
- Brass (single highlight accent — reserved for "memory" moments, i.e. AI callouts that reference history): `#B98D42`
- Brass deep: `#8F6A2E`
- Rust (sparing use — negative trend / alert only): `#A8503A`

**Type**
- Display / headlines / scores: **Fraunces** (serif, editorial character — this is intentional, avoid swapping for a generic sans)
- Body / UI text: **Inter**
- Stats, numbers, scorecard-style data: a monospace face (e.g. **JetBrains Mono**) — this is what gives logged data a "ledger" feel rather than a generic dashboard feel

**Signature element**
- A hand-drawn-feeling line connecting data points over time (used in the Insights/trends view) — this is the literal visual metaphor for "coach with memory." Keep it in brass, not pine, so it reads as the one moment of visual flourish rather than blending into the rest of the UI.
- Pine green backgrounds/cards are reserved specifically for AI feedback that references history. Don't use the pine card treatment for generic UI content — it should stay a signal that "this is the coach talking, and it remembers."

**General restraint**
- One accent color per view maximum (brass). Everything else is cream/pine/sage/ink.
- Fast, low-friction UI elements (steppers, chips, toggles) over multi-field forms, especially in the logging flows.

## Build order (from PRD)

1. Auth + round/hole logging, with local-first storage and background sync from day one — don't bolt offline support on later, it shapes the data layer from the start
2. Practice logging
3. Single-round AI summary (simplest Claude API call, no history yet)
4. Multi-round context — feed history into the prompt; this is where the actual product starts to exist
5. Trend/insight view surfaced in the UI
6. Freemium gate via in-app purchase (RevenueCat or native IAP) — free: logging + single-round summary; paid: trends + personalized recommendations

Steps 1–3 are mechanical. Step 4 is the real work — how history gets structured, summarized, and fit into a prompt without becoming bloated or generic is the core technical and product problem of this app. Spend the most design and iteration time there.

## What NOT to do

- Don't add course GPS, mapping, or real-time features without an explicit product decision to open that scope (see PRD section 9).
- Don't build swing video / computer vision analysis in this phase — significant scope expansion, deliberately deferred.
- Don't integrate hardware/sensor APIs (Arccos, Shot Scope) in v1 — manual logging only.
- Don't add social features (friends, leaderboards, sharing) — not part of the current product thesis.
- Don't generate AI feedback that could have been written without looking at the user's history — that defeats the entire premise of the product.
