import { randomInt } from "node:crypto";

export type Pairing = { homeId: string; awayId: string };

export function shuffleTeamIds(teamIds: string[]): string[] {
  const a = [...teamIds];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Single round-robin (even team count). Each pair plays once. */
export function roundRobinSchedule(teamIds: string[]): Pairing[] {
  const n = teamIds.length;
  if (n < 2) return [];
  if (n % 2 !== 0) {
    throw new Error("League needs an even number of teams for this scheduler");
  }
  const schedule: Pairing[] = [];
  const teams = [...teamIds];
  for (let round = 0; round < n - 1; round++) {
    for (let i = 0; i < n / 2; i++) {
      schedule.push({
        homeId: teams[i],
        awayId: teams[n - 1 - i],
      });
    }
    const last = teams.pop();
    if (last !== undefined) teams.splice(1, 0, last);
  }
  return schedule;
}

export function assertPowerOfTwoTeams(count: number): void {
  if (count < 2) throw new Error("Need at least 2 teams");
  if ((count & (count - 1)) !== 0) {
    throw new Error("Knockout needs a power-of-two team count (2, 4, 8, 16, …)");
  }
}

export type KnockoutBlueprint = {
  roundIndex: number;
  matchIndex: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeSourceRound: number | null;
  homeSourceMatch: number | null;
  awaySourceRound: number | null;
  awaySourceMatch: number | null;
};

/** Build metadata for knockout rounds; caller inserts rows and maps (round,match)->id for sources. */
export function knockoutBlueprint(teamIds: string[]): KnockoutBlueprint[] {
  assertPowerOfTwoTeams(teamIds.length);
  const n = teamIds.length;
  const rounds = Math.log2(n);
  const blueprint: KnockoutBlueprint[] = [];

  for (let m = 0; m < n / 2; m++) {
    blueprint.push({
      roundIndex: 0,
      matchIndex: m,
      homeTeamId: teamIds[m * 2],
      awayTeamId: teamIds[m * 2 + 1],
      homeSourceRound: null,
      homeSourceMatch: null,
      awaySourceRound: null,
      awaySourceMatch: null,
    });
  }

  for (let r = 1; r < rounds; r++) {
    const matchesInRound = n / 2 ** (r + 1);
    for (let m = 0; m < matchesInRound; m++) {
      blueprint.push({
        roundIndex: r,
        matchIndex: m,
        homeTeamId: null,
        awayTeamId: null,
        homeSourceRound: r - 1,
        homeSourceMatch: m * 2,
        awaySourceRound: r - 1,
        awaySourceMatch: m * 2 + 1,
      });
    }
  }

  return blueprint;
}
