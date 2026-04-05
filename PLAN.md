# RespiCore V.2 — Fix & Prototype Plan

## Problem
The Next.js project in `D:\RESPICORE V.2\respicore` has:
- Encoding issues (em-dashes rendered as `` across multiple files)
- Missing configuration files (postcss.config.mjs)
- Missing devDependencies (tailwindcss, postcss, @types/*)
- A middleware bug on `NextResponse.next({ request })`
- Incomplete features — only auth + dashboard, no landing page or triage demo

The reference demo in `D:\RESPICORE` has:
- Complete landing page with breathing-ring hero, interactive triage demo, pipeline explainer, tech stack cards, metrics, triage history table, auth modals, language switcher
- About page with team/timeline/comparison charts
- Reviews page with community feed

## What To Do

### Phase 1: Fix existing Next.js code
1. Fix encoding issues in:
   - `app/(auth)/login/page.tsx` — metadata string
   - `app/(auth)/signup/page.tsx` — metadata string
   - `components/auth/LoginForm.tsx` — placeholder character
   - `components/dashboard/MetricCard.tsx` — fallback characters
   - `components/dashboard/MetricsChart.tsx` — "Trend" label, badge characters
   - `app/(dashboard)/dashboard/DashboardClient.tsx` — avg spo2 fallback
   - `app/(dashboard)/layout.tsx` — comment encoding
   - `app/(dashboard)/dashboard/page.tsx` — comment encoding

2. Create missing config files:
   - `postcss.config.mjs`
   - `.gitignore`

3. Fix `middleware.ts` — remove `{ request }` from `NextResponse.next()`

4. Update `package.json` — add missing devDependencies:
   - `tailwindcss`, `postcss`, `@types/node`, `@types/react-dom`

5. Update `tailwind.config.ts` — add `darkMode: 'class'` (root layout sets `className="dark"`)

### Phase 2: Integrate demo content
6. Create a landing page (`app/page.tsx` rewrite) — port the index.html demo content to React, including:
   - Hero with breathing rings + stats
   - Interactive triage demo (condition selector, waveform canvas, timer, results)
   - Pipeline steps
   - Tech stack cards
   - Metrics/benchmarks
   - Triage history table

7. Create an About/Our Story page matching respicore_about.html

8. Create a Reviews page matching review.html

9. Wire up navigation between all pages

### Phase 3: Build & verify
10. Install dependencies
11. Run dev server and verify no errors
12. Test auth flow
