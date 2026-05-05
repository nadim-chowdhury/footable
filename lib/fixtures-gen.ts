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

/** Return the next power of two >= n. */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p *= 2;
  return p;
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
  isBye: boolean;
};

/**
 * Build metadata for knockout rounds.
 * Supports non-power-of-two team counts by inserting BYEs.
 * BYE matches are marked and should be auto-advanced after insertion.
 */
export function knockoutBlueprint(teamIds: string[]): KnockoutBlueprint[] {
  if (teamIds.length < 2) throw new Error("Need at least 2 teams");

  const slotCount = nextPowerOfTwo(teamIds.length);
  const byeCount = slotCount - teamIds.length;
  const rounds = Math.log2(slotCount);
  const blueprint: KnockoutBlueprint[] = [];

  // Seed teams: top seeds get byes. We place them so byes are spread out.
  const slots: (string | null)[] = new Array(slotCount).fill(null);
  // Fill real teams first, leaving nulls as BYEs
  for (let i = 0; i < teamIds.length; i++) {
    slots[i] = teamIds[i];
  }

  // Round 0: first-round matches
  for (let m = 0; m < slotCount / 2; m++) {
    const home = slots[m * 2];
    const away = slots[m * 2 + 1];
    const isBye = home === null || away === null;
    blueprint.push({
      roundIndex: 0,
      matchIndex: m,
      homeTeamId: home,
      awayTeamId: away,
      homeSourceRound: null,
      homeSourceMatch: null,
      awaySourceRound: null,
      awaySourceMatch: null,
      isBye,
    });
  }

  // Subsequent rounds
  for (let r = 1; r < rounds; r++) {
    const matchesInRound = slotCount / 2 ** (r + 1);
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
        isBye: false,
      });
    }
  }

  return blueprint;
}
