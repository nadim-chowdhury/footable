export type StandingRow = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type FixtureForStandings = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
};

export function computeLeagueStandings(
  fixtures: FixtureForStandings[],
): StandingRow[] {
  const map = new Map<string, StandingRow>();

  const ensure = (id: string) => {
    let row = map.get(id);
    if (!row) {
      row = {
        teamId: id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      };
      map.set(id, row);
    }
    return row;
  };

  for (const f of fixtures) {
    if (f.stage !== "league") continue;
    if (f.homeScore === null || f.awayScore === null) continue;

    const home = ensure(f.homeTeamId);
    const away = ensure(f.awayTeamId);
    home.played += 1;
    away.played += 1;
    home.gf += f.homeScore;
    home.ga += f.awayScore;
    away.gf += f.awayScore;
    away.ga += f.homeScore;

    if (f.homeScore > f.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.pts += 3;
    } else if (f.homeScore < f.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.pts += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  for (const row of map.values()) {
    row.gd = row.gf - row.ga;
  }

  return [...map.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamId.localeCompare(b.teamId);
  });
}
