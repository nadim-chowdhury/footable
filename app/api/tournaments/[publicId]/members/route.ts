import { jsonError } from "@/lib/api-errors";
import { requireTournamentPin } from "@/lib/route-auth";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(request: Request, context: Ctx) {
  const { publicId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  if (auth.tournament.fixtures_generated) {
    return jsonError("Tournament is locked after fixtures are generated", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const displayName = String(
    (body as { displayName?: string }).displayName ?? "",
  ).trim();
  if (!displayName) return jsonError("displayName is required", 400);

  // Check for duplicate display_name in this tournament
  const existing = await auth.sql`
    select id from members
    where tournament_id = ${auth.tournament.id} and lower(display_name) = lower(${displayName})
    limit 1
  `;
  if (existing.length > 0) {
    return jsonError(
      "A player with this name already exists in the tournament",
      400,
    );
  }

  const rows = (await auth.sql`
    insert into members (tournament_id, display_name)
    values (${auth.tournament.id}, ${displayName})
    returning id, display_name
  `) as { id: string; display_name: string }[];

  const m = rows[0];
  if (!m) return jsonError("Failed to add member", 500);
  return Response.json({ id: m.id, displayName: m.display_name });
}
