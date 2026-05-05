import { jsonError } from "@/lib/api-errors";
import { requireTournamentPin } from "@/lib/route-auth";
import {
  clearDownstreamPropagation,
  propagateKnockoutWinner,
} from "@/lib/tournament-data";

type Ctx = { params: Promise<{ publicId: string; fixtureId: string }> };

function parseScore(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  if (n > 99) return null; // reasonable max
  return n;
}

export async function PATCH(request: Request, context: Ctx) {
  const { publicId, fixtureId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const b = body as { homeScore?: unknown; awayScore?: unknown };
  const homeScore = parseScore(b.homeScore);
  const awayScore = parseScore(b.awayScore);
  if (homeScore === null || awayScore === null) {
    return jsonError(
      "homeScore and awayScore must be non-negative integers (0–99)",
      400,
    );
  }

  const tid = auth.tournament.id;
  const rows = (await auth.sql`
    select id, stage, home_team_id, away_team_id, is_bye
    from fixtures
    where id = ${fixtureId}::uuid and tournament_id = ${tid}
  `) as {
    id: string;
    stage: string;
    home_team_id: string | null;
    away_team_id: string | null;
    is_bye: boolean;
  }[];

  const fx = rows[0];
  if (!fx) return jsonError("Fixture not found", 404);
  if (fx.is_bye) return jsonError("Cannot edit a BYE match", 400);
  if (fx.home_team_id === null || fx.away_team_id === null) {
    return jsonError("Both teams must be set before entering a result", 400);
  }
  if (fx.stage === "knockout" && homeScore === awayScore) {
    return jsonError("Knockout needs a winner — scores cannot be equal", 400);
  }

  // For knockout: clear downstream propagation before updating
  if (fx.stage === "knockout") {
    await clearDownstreamPropagation(auth.sql, fixtureId);
  }

  await auth.sql`
    update fixtures
    set home_score = ${homeScore}, away_score = ${awayScore}, played_at = now()
    where id = ${fixtureId}::uuid
  `;

  await propagateKnockoutWinner(auth.sql, fixtureId);

  return Response.json({ ok: true });
}
