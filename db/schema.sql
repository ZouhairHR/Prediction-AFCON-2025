-- Schema for the AFCON 2025 predictor application
--
-- This script defines the core tables, foreign keys and row‑level security (RLS)
-- policies required to implement the tournament predictor.  You can run this
-- script in the SQL editor of your Supabase project.  It assumes that the
-- `auth.users` table already exists and that you're using the default
-- schema `public` for application data.

-- Enable extensions if necessary
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles
-- Stores user metadata, linked to auth.users via a foreign key on id.  The
-- username field is used as a login handle and is mapped to a fake email
-- address for Supabase Auth.  is_admin distinguishes admins from participants.
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  username text not null unique,
  is_admin boolean not null default false,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ---------------------------------------------------------------------------
-- tournaments
-- Identifies a tournament (e.g. AFCON2025).  Storing tournaments separately
-- allows the system to support multiple seasons or competitions in the future.
-- ---------------------------------------------------------------------------
create table if not exists tournaments (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  season text not null,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Insert a default tournament for AFCON 2025
insert into tournaments (code, name, season)
  values ('AFCON2025', 'Africa Cup of Nations 2025', '2025')
  on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- teams
-- Lists national teams participating in a tournament.  The seed_rank column is
-- used as a deterministic fallback when all other tiebreakers are equal.
-- group_code must be one of A–F for group stage participants.
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  group_code text check (group_code in ('A','B','C','D','E','F')),
  seed_rank integer not null,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists teams_tournament_name_idx
  on teams (tournament_id, name);

-- ---------------------------------------------------------------------------
-- matches
-- Defines fixtures for the tournament.  Each match references two teams, has
-- a stage, optional group_code for group matches, a scheduled kickoff time
-- (UTC), and columns for the real results.  Penalty scores are NULL unless
-- the match goes to penalties.  Stages use a fixed set of codes.
-- ---------------------------------------------------------------------------
create type match_stage as enum ('GROUP','R16','QF','SF','3P','F');

create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  stage match_stage not null,
  group_code text,
  home_team_id uuid not null references teams(id) on delete cascade,
  away_team_id uuid not null references teams(id) on delete cascade,
  kickoff_at timestamp with time zone not null,
  result_home integer,
  result_away integer,
  result_pens_home integer,
  result_pens_away integer,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint stage_group_check check (
    (stage = 'GROUP' and group_code is not null) or
    (stage <> 'GROUP' and group_code is null)
  )
);

-- ---------------------------------------------------------------------------
-- predictions
-- Stores predicted scores and (optionally) penalty shoot‑out results for a
-- particular match made by a participant.  Penalty columns are NULL when
-- the participant predicts that the match does not go to penalties.  There is
-- a unique constraint so that each user may submit at most one prediction per
-- match.
-- ---------------------------------------------------------------------------
create table if not exists predictions (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pred_home integer not null,
  pred_away integer not null,
  pred_pens_home integer,
  pred_pens_away integer,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint unique_user_match_prediction unique (match_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Derived Views
-- The following views encapsulate complex logic so that the frontend can
-- retrieve ready‑made group tables, best third rankings, knockout brackets,
-- points per match and the leaderboard.  They are deliberately incomplete
-- and should be filled out according to the tournament rules described in
-- the specification.
-- ---------------------------------------------------------------------------

-- v_group_tables
-- For each user and each group, compute the table of teams with points,
-- goal difference, goals for, goals against, and wins based on predicted
-- scores.  Apply head‑to‑head tiebreakers and deterministic seed ranking.
create or replace view v_group_tables as
select
  p.user_id,
  t.group_code,
  t.id as team_id,
  t.name,
  -- TODO: compute points, goals_for, goals_against, goal_diff, wins
  0 as points,
  0 as goals_for,
  0 as goals_against,
  0 as goal_diff,
  0 as wins,
  t.seed_rank
from teams t
cross join (select distinct user_id from predictions) p
where t.tournament_id in (select id from tournaments where code = 'AFCON2025');

-- v_best_thirds
-- Determine the four best third‑placed teams across all groups for each user
-- according to points, goal difference and goals scored.  Use seed_rank as
-- a deterministic fallback.  The result should include the user's id, the
-- team id, the rank among third‑placed teams and the group code.
create or replace view v_best_thirds as
select
  gt.user_id,
  gt.team_id,
  gt.group_code,
  -- TODO: compute ranking among third‑placed teams
  row_number() over (partition by gt.user_id order by gt.points desc, gt.goal_diff desc, gt.goals_for desc, gt.seed_rank asc) as third_rank
from v_group_tables gt
where -- identify third‑placed teams per group (rank = 3)
  false;

-- v_knockout_brackets
-- For each user, generate the Round of 16 matchups based on group winners,
-- runners‑up and the combination of third‑placed groups that qualified.
-- Encode the CAF mapping of third‑place combinations (15 possible keys)
-- to determine which winner plays which third‑placed team.  The view should
-- continue to propagate winners into the quarterfinals, semifinals and final
-- based on predicted results.
create or replace view v_knockout_brackets as
select
  p.user_id,
  m.id as match_id,
  m.stage,
  m.home_team_id,
  m.away_team_id,
  -- TODO: compute home and away qualifiers for knockout matches
  null::uuid as qual_home_team_id,
  null::uuid as qual_away_team_id
from matches m
cross join (select distinct user_id from predictions) p
where m.stage <> 'GROUP';

-- v_points_per_match
-- Compute points earned by each user for each match according to the scoring
-- system.  Include components (AET score, qualification, penalties) so that
-- the frontend can display a breakdown.  Real results are taken from
-- matches.result_home / result_away / result_pens_*.  Predicted values come
-- from predictions.
create or replace view v_points_per_match as
select
  pr.user_id,
  pr.match_id,
  -- TODO: join matches and compute points
  0 as points_aet,
  0 as points_qualification,
  0 as points_penalties,
  0 as total_points
from predictions pr;

-- v_leaderboard
-- Sum the points per user across all matches to produce the leaderboard.
create or replace view v_leaderboard as
select
  ppm.user_id,
  sum(ppm.total_points) as total_points
from v_points_per_match ppm
group by ppm.user_id;

-- ---------------------------------------------------------------------------
-- Row‑Level Security Policies
-- Enable RLS on tables and define policies to restrict access.  Adjust these
-- policies according to your application's requirements.
-- ---------------------------------------------------------------------------

-- Enable RLS
alter table profiles enable row level security;
alter table matches enable row level security;
alter table teams enable row level security;
alter table predictions enable row level security;

-- profiles: users can read their own profile; admins can read all
create policy if not exists "Profiles: self read" on profiles
  for select
  using (auth.uid() = id);

create policy if not exists "Profiles: admin read" on profiles
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy if not exists "Profiles: admin write" on profiles
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- teams: everyone can read; only admins can insert/update/delete
create policy if not exists "Teams: read all" on teams
  for select using (true);

create policy if not exists "Teams: admin write" on teams
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- matches: everyone can read; only admins can write
create policy if not exists "Matches: read all" on matches
  for select using (true);

create policy if not exists "Matches: admin write" on matches
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- predictions: users can insert/update their own predictions before kickoff; can read their own predictions; admins can read all
create policy if not exists "Predictions: user insert" on predictions
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Predictions: user update" on predictions
  for update
  using (auth.uid() = user_id and now() < (select kickoff_at from matches where id = match_id));

create policy if not exists "Predictions: user read" on predictions
  for select
  using (auth.uid() = user_id);

create policy if not exists "Predictions: admin read" on predictions
  for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- End of schema