import { jsonError } from "@/lib/api-errors";
import {
  knockoutBlueprint,
  roundRobinSchedule,
  shuffleTeamIds,
} from "@/lib/fixtures-gen";
import { requireTournamentPin } from "@/lib/route-auth";
import { propagateKnockoutWinner } from "@/lib/tournament-data";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(request: Request, context: Ctx) {
  const { publicId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  const tid = auth.tournament.id;
  const format = auth.tournament.format;

  try {
    await auth.sql.begin(async (tx) => {
      const lock = (await tx`
        select fixtures_generated from tournaments where id = ${tid} for update
      `) as { fixtures_generated: boolean }[];
      if (!lock[0]) throw new Error("Tournament missing");
      if (lock[0].fixtures_generated) {
        throw new Error("ALREADY");
      }

      await tx`delete from fixtures where tournament_id = ${tid}`;

      const teamRows = (await tx`
        select id, label from teams where tournament_id = ${tid} order by label
      `) as { id: string; label: string }[];

      if (teamRows.length < 2) {
        throw new Error("TEAMS");
      }

      if (format === "league") {
        const teamIds = teamRows.map((t) => t.id);
        const schedule = roundRobinSchedule(teamIds);
        for (let i = 0; i < schedule.length; i++) {
          const { homeId, awayId, roundIndex, matchIndex } = schedule[i];
          await tx`
            insert into fixtures (
              tournament_id, round_index, match_index, stage,
              home_team_id, away_team_id
            ) values (
              ${tid}, ${roundIndex}, ${matchIndex}, 'league',
              ${homeId}::uuid, ${awayId}::uuid
            )
          `;
        }
      } else {
        // Knockout: support non-power-of-two via byes
        const teamIds = shuffleTeamIds(teamRows.map((t) => t.id));
        const blueprint = knockoutBlueprint(teamIds);
        const idByRoundMatch = new Map<string, string>();

        for (const b of blueprint) {
          let homeSource: string | null = null;
          let awaySource: string | null = null;
          if (
            b.homeSourceRound !== null &&
            b.homeSourceMatch !== null &&
            b.awaySourceRound !== null &&
            b.awaySourceMatch !== null
          ) {
            homeSource =
              idByRoundMatch.get(`${b.homeSourceRound}:${b.homeSourceMatch}`) ??
              null;
            awaySource =
              idByRoundMatch.get(`${b.awaySourceRound}:${b.awaySourceMatch}`) ??
              null;
            if (!homeSource || !awaySource) throw new Error("BRACKET");
          }

          const inserted = (await tx`
            insert into fixtures (
              tournament_id, round_index, match_index, stage,
              home_team_id, away_team_id,
              home_source_fixture_id, away_source_fixture_id,
              is_bye
            ) values (
              ${tid}, ${b.roundIndex}, ${b.matchIndex}, 'knockout',
              ${b.homeTeamId}, ${b.awayTeamId},
              ${homeSource}, ${awaySource},
              ${b.isBye}
            )
            returning id
          `) as { id: string }[];

          const id = inserted[0]?.id;
          if (!id) throw new Error("INSERT");
          idByRoundMatch.set(`${b.roundIndex}:${b.matchIndex}`, id);
        }

        // Auto-advance BYE matches: the real team wins automatically
        const byeFixtures = (await tx`
          select id, home_team_id, away_team_id from fixtures
          where tournament_id = ${tid} and is_bye = true
        `) as {
          id: string;
          home_team_id: string | null;
          away_team_id: string | null;
        }[];

        for (const bf of byeFixtures) {
          const winner = bf.home_team_id ?? bf.away_team_id;
          if (!winner) continue;
          // Set score to auto-win (e.g., 3-0)
          await tx`
            update fixtures
            set home_score = ${bf.home_team_id ? 3 : 0},
                away_score = ${bf.away_team_id ? 3 : 0},
                played_at = now()
            where id = ${bf.id}
          `;
        }
      }

      await tx`update tournaments set fixtures_generated = true where id = ${tid}`;
    });

    // After transaction, propagate BYE winners to next round
    if (format === "knockout") {
      const byeFixtures = (await auth.sql`
        select id from fixtures
        where tournament_id = ${tid} and is_bye = true
      `) as { id: string }[];

      for (const bf of byeFixtures) {
        await propagateKnockoutWinner(auth.sql, bf.id);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY") {
      return jsonError("Fixtures were already generated", 400);
    }
    if (msg === "TEAMS") {
      return jsonError(
        "Add at least two teams before generating fixtures",
        400,
      );
    }
    if (msg === "EVEN") {
      return jsonError("League format needs an even number of teams", 400);
    }
    throw e;
  }

  return Response.json({ ok: true });
}
