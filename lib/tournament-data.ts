import postgres from "postgres";
import { computeLeagueStandings } from "@/lib/standings";

type Sql = postgres.Sql;

export type TournamentRow = {
  id: string;
  public_id: string;
  name: string;
  format: string;
  team_mode: string;
  fixtures_generated: boolean;
  created_at: Date;
};

export type MemberRow = { id: string; display_name: string };
export type TeamRow = { id: string; label: string; memberIds: string[] };
export type FixtureRow = {
  id: string;
  round_index: number;
  match_index: number;
  stage: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_source_fixture_id: string | null;
  away_source_fixture_id: string | null;
  home_score: number | null;
  away_score: number | null;
  played_at: Date | null;
  home_label: string | null;
  away_label: string | null;
};

export async function loadTournamentByPublicId(
  sql: Sql,
  publicId: string,
): Promise<(TournamentRow & { pin_hash: string }) | null> {
  const rows = await sql`select id, public_id, name, format, team_mode, fixtures_generated, created_at, pin_hash
    from tournaments where public_id = ${publicId}::uuid`;
  return (rows[0] as (TournamentRow & { pin_hash: string }) | undefined) ?? null;
}

export async function loadTournamentBundle(sql: Sql, tournamentId: string) {
  const members = (await sql`select id, display_name from members
    where tournament_id = ${tournamentId} order by display_name`) as MemberRow[];

  const teamRows = (await sql`select id, label from teams
    where tournament_id = ${tournamentId} order by label`) as { id: string; label: string }[];

  const links = (await sql`select team_id, member_id from team_members
    where team_id in (select id from teams where tournament_id = ${tournamentId})`) as {
    team_id: string;
    member_id: string;
  }[];

  const memberByTeam = new Map<string, string[]>();
  for (const l of links) {
    const list = memberByTeam.get(l.team_id) ?? [];
    list.push(l.member_id);
    memberByTeam.set(l.team_id, list);
  }

  const teams: TeamRow[] = teamRows.map((r) => ({
    id: r.id,
    label: r.label,
    memberIds: memberByTeam.get(r.id) ?? [],
  }));

  const fixtures = (await sql`select
      f.id, f.round_index, f.match_index, f.stage,
      f.home_team_id, f.away_team_id,
      f.home_source_fixture_id, f.away_source_fixture_id,
      f.home_score, f.away_score, f.played_at,
      ht.label as home_label, at.label as away_label
    from fixtures f
    left join teams ht on ht.id = f.home_team_id
    left join teams at on at.id = f.away_team_id
    where f.tournament_id = ${tournamentId}
    order by case when f.stage = 'league' then 0 else 1 end, f.round_index asc, f.match_index asc`) as FixtureRow[];

  const standings = computeLeagueStandings(
    fixtures.map((f) => ({
      homeTeamId: f.home_team_id ?? "",
      awayTeamId: f.away_team_id ?? "",
      homeScore: f.home_score,
      awayScore: f.away_score,
      stage: f.stage,
    })).filter((f) => f.homeTeamId && f.awayTeamId),
  );

  return { members, teams, fixtures, standings };
}

export async function propagateKnockoutWinner(sql: Sql, fixtureId: string) {
  const rows = (await sql`select stage, home_score, away_score, home_team_id, away_team_id from fixtures where id = ${fixtureId}`) as {
    stage: string;
    home_score: number | null;
    away_score: number | null;
    home_team_id: string | null;
    away_team_id: string | null;
  }[];
  const f = rows[0];
  if (!f || f.stage !== "knockout") return;
  if (f.home_score === null || f.away_score === null) return;
  if (f.home_score === f.away_score) return;
  const winner =
    f.home_score > f.away_score ? f.home_team_id : f.away_team_id;
  if (!winner) return;

  await sql`update fixtures set home_team_id = ${winner} where home_source_fixture_id = ${fixtureId}`;
  await sql`update fixtures set away_team_id = ${winner} where away_source_fixture_id = ${fixtureId}`;
}
