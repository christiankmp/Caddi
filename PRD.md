# Caddi — Product Requirements Document

**Status:** Draft v1 — MVP scope
**Owner:** Christian
**Last updated:** July 2026

---

## 1. Vision

Caddi is an AI golf coach that remembers. Most golf apps analyze a single round in isolation and forget it ever happened. Caddi logs practices and rounds over time and gives feedback that references patterns across weeks and months — not just "here's your score," but "here's what's actually changing in your game, and why."

The product bet: **memory compounds.** The more a golfer logs, the smarter and more specific the coaching gets. That's the moat, and it's the thing a solo builder can actually defend — most competitors are either static analysis tools (one round, no history) or hardware-first platforms (Arccos, Shot Scope) that compete on sensors, not intelligence.

## 2. Platform

Caddi is a **native mobile app** for iOS and Android, not a web app. Logging happens standing on a course or at a range — this is a phone-in-pocket product, not a desktop one. That has real consequences:
- **Connectivity can't be assumed.** Courses routinely have patchy signal. Logging must work offline and sync later — a lost hole entry is a lost user.
- **Speed is physical, not just visual.** "Fast to log" means native-feeling taps and steppers with haptic feedback, not just a clean-looking form.
- **Distribution is through app stores**, which has downstream effects on monetization (see section 11) and release cadence (App Store/Play Store review, not instant deploys).

## 3. Problem

Golfers who want to improve have two bad options today:
- **Generic instruction content** (YouTube, static tip apps) that has no idea what *their* game actually looks like.
- **Stat-tracking apps** that show numbers but don't turn them into a coherent story about what to work on next, and don't connect practice to on-course results.

Nobody is closing the loop: log → understand the pattern → practice the right thing → see it show up in the next round → log again.

## 4. Target user

A golfer who already tracks their game to some degree (or wants to) and is motivated by improvement, not just a scorecard. Likely plays regularly (weekly-ish), practices with some intent, and would value a coach relationship they can't otherwise afford or access. Not a beginner who just wants to have fun — someone treating golf as a skill they're actively building.

## 5. Product principles

1. **Memory is the product.** Every feature should ask: does this get better because we remember the last 10 sessions, not just this one? If a feature would work identically with no history, it's not core to Caddi.
2. **Logging must be fast.** If logging a round or practice session takes more than a minute of friction, people stop doing it, and the whole product collapses — no data in means no insight out.
3. **Coach, not dashboard.** Feedback is written like a coach talking to a player, grounded in specifics ("your GIR has dropped 3 rounds in a row since you stopped short-game practice"), not a generic stats page.
4. **Async only, for now.** Caddi is used before and after golf, not during. No real-time on-course features in this version — see section 10.

## 6. Core loop

**Log → get feedback → practice the right thing → log again.**

Everything in the MVP either feeds this loop or gets cut.

## 7. MVP scope

### 7.1 Round logging (per-hole)
- Score, putts, fairway hit (Y/N/N-A), GIR (Y/N) per hole
- Course name (free text — no course database in v1)
- Fast entry: steppers and toggle chips, no required fields beyond score, designed to be completed in under a minute per hole
- Must work fully offline — writes to local storage first, syncs to Supabase when connectivity returns (see section 2)

### 7.2 Practice logging
- Focus area (short game, putting, full swing, bunker, course strategy — extensible list)
- Duration
- Qualitative feel (rough / solid / breakthrough)
- Freeform notes

### 7.3 Memory layer
- Every round and practice session stored against the user with a timestamp
- Before generating any feedback, the AI call pulls relevant recent history — not just the latest entry
- This is the actual product, not an implementation detail — see CLAUDE.md for how this should be structured

### 7.4 AI feedback
- Post-round: 2–3 sentence summary plus one specific, history-grounded focus area
- Once enough data exists (3+ rounds), a trend read: "your weak point right now is X, and here's the pattern that shows it"
- Feedback must cite the specific pattern it's responding to (e.g., "3rd round in a row," "since you started logging X") — never generic golf tips

### 7.5 Practice recommendation
- Given the identified weak point, suggest a specific, concrete drill or focus area for the next session
- Should reference why — tie the recommendation back to the data that produced it

### 7.6 Insights / trends view
- The payoff screen. Visualizes a stat over time (GIR, putts, scoring average) with enough of a story that the user can see cause and effect (e.g., practice frequency vs. scoring average)
- Surfaces at least one "pattern detected" callout when the data supports one

## 8. Explicitly out of scope for v1

- Swing video / computer vision analysis
- GPS or course mapping
- Real-time on-course caddy features (club selection, live shot advice)
- Hardware or sensor integration (Arccos, Shot Scope APIs)
- Social features — friends, leaderboards, sharing
- Multi-course structured database
- Any feature that only works within a single session and ignores history

These may become v2+ considerations, but only after the memory-driven coaching loop is proven. See section 13.

## 9. Data model (conceptual)

```
users
rounds            (user_id, date, course_name, total_score, total_putts)
holes             (round_id, hole_number, score, putts, fairway_hit, gir, penalties)
practice_sessions (user_id, date, focus_area, duration, feel, notes)
ai_insights        (user_id, generated_at, summary, recommendation, based_on_round_ids[], based_on_practice_ids[])
```

Storing which specific rounds/sessions each insight was generated from is a requirement, not a nice-to-have — it's what makes the "coach with memory" claim auditable and improvable, and it's what lets future features (e.g., "why did you say that?") work.

## 10. Relationship to the "AI caddy" idea

An earlier direction considered a real-time on-course caddy (club/shot advice while playing). That's deliberately deferred:
- It requires GPS, course data, and live context — a much heavier technical lift than anything in this MVP
- It's a crowded space where the winners pair software with hardware (sensors, GPS watches) — hard to compete on software alone
- It carries a higher trust bar: bad real-time advice costs a shot, bad coaching advice is just a missed insight
- It becomes *stronger*, not weaker, once built on top of coach data — a caddy that already knows "this golfer pushes 7-irons right under pressure" is a materially better product than a caddy with no history

So: caddy is a plausible v2+ feature built **on top of** the memory layer, not a parallel v1 track.

## 11. Monetization

Freemium, consistent with the brand and model already locked in:
- **Free:** round and practice logging, single-round AI summary
- **Paid:** trend/insight view, personalized practice recommendations, full history-grounded coaching

The paid tier gates the layer where memory actually compounds — which is also the layer that's hardest for a competitor to replicate quickly.

As a native app, subscription billing runs through Apple's and Google's in-app purchase systems (not a web checkout) — factor the platform fee (typically up to 30%, often lower after year one or under small-business programs) into pricing.

## 12. Brand and design direction

Established brand system: cream base with pine green as the signature color, brass as a single highlight accent reserved for "memory" moments (AI callouts that reference history). Fraunces (serif) for headlines and numbers, Inter for UI text, a mono face for stats to give a scorecard-ledger feel. Full detail and rationale in the design mockup delivered separately; source of truth for tokens should live in CLAUDE.md as the codebase is built.

## 13. Success signals for v1

- % of logged rounds that also have a practice session logged within 5 days (proxy for the loop actually closing)
- Retention of logging behavior over 4+ weeks (does the habit stick, or does logging drop off after week one)
- Whether users say the AI feedback feels specific to them vs. generic — this is the entire value proposition, and if it doesn't land, nothing else matters

## 14. Open questions

- How much history is "enough" before insights feel credible rather than presumptuous? (Working assumption: 3+ rounds minimum before surfacing trend-level claims.)
- Should practice focus-area categories be fixed or user-extensible in v1?
- Bottom nav has 4 top-level destinations (Home, Log, Insights, Practice) — worth testing whether Log and Practice should collapse into a single "Add" action.
- Offline sync conflict handling: if a round is logged offline on two devices (unlikely but possible), what's the resolution strategy? Worth a explicit decision before multi-device use is common.