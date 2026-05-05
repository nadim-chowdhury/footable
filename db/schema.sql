-- Footable: tournaments, members, teams, fixtures
-- Requires PostgreSQL 13+ (gen_random_uuid)

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name text NOT NULL,
  format text NOT NULL CHECK (format IN ('league', 'knockout')),
  team_mode text NOT NULL CHECK (team_mode IN ('solo', 'duo')),
  pin_hash text NOT NULL,
  fixtures_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  display_name text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_tournament ON members (tournament_id);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  label text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams (tournament_id);

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members (member_id);

CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  round_index int NOT NULL,
  match_index int NOT NULL,
  stage text NOT NULL CHECK (stage IN ('league', 'knockout')),
  home_team_id uuid REFERENCES teams (id) ON DELETE SET NULL,
  away_team_id uuid REFERENCES teams (id) ON DELETE SET NULL,
  home_source_fixture_id uuid REFERENCES fixtures (id) ON DELETE SET NULL,
  away_source_fixture_id uuid REFERENCES fixtures (id) ON DELETE SET NULL,
  home_score int,
  away_score int,
  played_at timestamptz,
  UNIQUE (tournament_id, stage, round_index, match_index)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_tournament ON fixtures (tournament_id);
