# AFCON 2025 Predictor

This repository contains a skeleton implementation of a **fully‑automated football prediction web application** for the African Cup of Nations (**AFCON 2025 – Morocco**).  The project is designed to replace an Excel‑based predictor by automating all qualification logic, bracket generation and points calculation while giving administrators a simple interface to enter real results and participants a dead‑simple interface to enter scores.  The solution is built on **Next.js** with the app router (using Server Components and Server Actions), **TypeScript**, **Supabase** for data storage and authentication, and **Vercel** for hosting.  It follows the comprehensive specification supplied by the user and can be used as a starting point for further development.

## Features

* **Sign‑up / login** flows backed by Supabase Auth.  Usernames are mapped to fake email addresses of the form `username@afcon.local` to satisfy Supabase’s requirement for an email field.
* **Role‑based access control** using a `profiles` table with an `is_admin` boolean.  Row‑level security policies are encoded in Supabase to ensure that participants can only read/write their own predictions and administrators can manage tournament data.
* **Preloaded tournament data** for AFCON 2025: 24 teams, 6 groups (A–F), and all fixtures up to the final.  The admin sees a results entry page where they can record final scores and penalty shoot‑outs; participants never enter who qualifies – the application infers winners based on predicted scores and penalties.
* **Automated group tables** built from each participant’s predicted scores.  The ranking logic implements CAF Article 74: points, head‑to‑head points, head‑to‑head goal difference, head‑to‑head goals scored, overall goal difference, overall goals scored, and finally a deterministic seed rank for tiebreaks.  The app also computes the ranking of the four best third‑placed teams according to CAF Article 75.4.
* **Automated knockout bracket** generation for the Round of 16 and beyond.  A static mapping encodes all 15 possible combinations of third‑placed groups and determines which third‑placed team faces which group winner.  Winners automatically progress through the bracket (R16 → QF → SF → Final / Third Place) based on predicted scores and penalties.
* **Points calculation** consistent with the provided model: in the group stage, exact score yields 3 points and correct outcome 1 point.  In knockout matches the points are split into three components: score after 120 minutes (3/1/0), qualification prediction (2), and penalty score (1 point only if the match goes to penalties).  Maximum points are 5 for matches decided in normal/extra time and 6 for those decided by penalties.
* **Leaderboard** page showing the total points of each participant.  This view updates automatically after real results are entered by the administrator.

## Project Structure

The project uses the Next.js app router.  Pages live under the `app/` directory and can fetch data directly from Supabase via server actions or React hooks.  The most important files are:

| Path | Purpose |
|---|---|
| `app/layout.tsx` | Root layout that defines the base HTML structure and includes a React Query provider if desired. |
| `app/login/page.tsx` | Login form using Supabase Auth. |
| `app/signup/page.tsx` | Sign‑up form where users choose a full name and username; the backend maps the username to a dummy email for Supabase. |
| `app/predictions/page.tsx` | Main interface for participants to enter predicted scores.  It displays fixtures grouped by stage; inputs lock automatically at kickoff using the match’s `kickoff_at` timestamp. |
| `app/leaderboard/page.tsx` | Read‑only leaderboard displaying each participant’s total points.  Admins may also view a per‑match breakdown in the future. |
| `app/admin/results/page.tsx` | Admin‑only page to record real match results, including penalties.  Once results are saved, the system recalculates points and updates the bracket. |
| `lib/supabaseBrowserClient.ts` | Returns a browser‑side Supabase client for use in client components. |
| `lib/supabaseServerClient.ts` | Returns a server‑side Supabase client bound to the current request’s cookies. |
| `db/schema.sql` | PostgreSQL schema defining tables (`profiles`, `tournaments`, `teams`, `matches`, `predictions`) and views for group tables, best third ranking, bracket generation, per‑match points and leaderboard.  It also includes example row‑level security policies. |

The code is intentionally incomplete; most functions are placeholders that should be filled in with queries and business logic.  Nevertheless the skeleton demonstrates how to organise pages, how to call server actions, and how to enforce RBAC.

## Database Schema

The schema is defined in `db/schema.sql`.  It follows the required structure:

* `profiles`: stores user metadata and a boolean `is_admin` column.  This table extends `auth.users` via a foreign key on `id`.
* `tournaments`: identifies a tournament (here, only AFCON 2025).  Useful for multi‑season support.
* `teams`: lists all 24 national teams, their group assignments (A–F), and a `seed_rank` used for deterministic tiebreaking when all other criteria are equal.
* `matches`: defines each fixture with a stage (GROUP, R16, QF, SF, 3P, F), optional group code, scheduled kickoff time, and columns for the actual result.  Penalty scores are nullable and only filled when a match goes to a shoot‑out.
* `predictions`: stores each participant’s predicted scores and penalty shoot‑out results.  Penalty columns remain `NULL` unless the predicted match ends in a draw after extra time.

View definitions (`v_group_tables`, `v_best_thirds`, `v_knockout_brackets`, `v_points_per_match`, `v_leaderboard`) encapsulate complex computations in SQL so that the frontend can simply query ready‑made tables.  Row‑level security policies ensure that participants can read and write only their own predictions while admins can manage everything.

## Running Locally

> **Note**: This repository is a scaffold and does not include compiled dependencies.  To run it locally you will need to install dependencies and set environment variables pointing to your Supabase project.

1. **Install dependencies** using your preferred package manager.  For example, with pnpm:
   ```bash
   pnpm install
   ```

2. **Copy the example environment file** and provide your Supabase credentials.  At a minimum you need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if you prefer a different name).  The optional `SUPABASE_SERVICE_ROLE_KEY` is used by server actions.
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your SUPABASE_URL and SUPABASE_ANON_KEY
   ```

3. **Apply the database schema** to your Supabase project.  You can run the contents of `db/schema.sql` in the SQL editor on app.supabase.com.

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. Open `http://localhost:3000` in your browser.  You should see the login/sign‑up pages and can experiment with the prediction flows.

When deploying to **Vercel**, set the appropriate environment variables and connect to the same Supabase database.  Vercel will automatically deploy the Next.js app with server actions enabled.

## Next Steps

The current scaffold leaves several areas to be implemented:

1. **Populate fixtures and teams**: Insert rows into `teams` and `matches` tables using the official AFCON 2025 schedule.
2. **Implement server actions**: Each page imports functions that call Supabase to fetch matches, upsert predictions, compute group tables etc.  These need to be filled in.
3. **Complete views and points logic**: The SQL views in `db/schema.sql` should be fully defined to calculate group standings, third‑place rankings and points per match.
4. **Enforce RLS policies**: Define row‑level security policies in Supabase to restrict access as outlined in the specification.
5. **Test edge cases**: Ensure tiebreakers and third‑place mapping follow CAF rules exactly and handle deterministic fallback via seed ranking.

This repository provides a foundation for building a modern, secure and automated tournament predictor that adheres to the official CAF regulations and simplifies participation for fans.  Contributions and refinements are welcome!