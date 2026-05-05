import { jsonError } from "@/lib/api-errors";
import { requireTournamentPin } from "@/lib/route-auth";

type Ctx = { params: Promise<{ publicId: string; memberId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const { publicId, memberId } = await context.params;
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
  const displayName = String((body as { displayName?: string }).displayName ?? "").trim();
  if (!displayName) return jsonError("displayName is required", 400);

  const updated = await auth.sql`
    update members set display_name = ${displayName}
    where id = ${memberId}::uuid and tournament_id = ${auth.tournament.id}
    returning id
  `;
  if (updated.length === 0) return jsonError("Member not found", 404);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: Ctx) {
  const { publicId, memberId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  if (auth.tournament.fixtures_generated) {
    return jsonError("Tournament is locked after fixtures are generated", 400);
  }

  const used = await auth.sql`
    select 1 from team_members tm
    join teams t on t.id = tm.team_id
    where tm.member_id = ${memberId}::uuid and t.tournament_id = ${auth.tournament.id}
    limit 1
  `;
  if (used.length > 0) {
    return jsonError("Remove this player from teams before deleting", 400);
  }

  const deleted = await auth.sql`
    delete from members
    where id = ${memberId}::uuid and tournament_id = ${auth.tournament.id}
    returning id
  `;
  if (deleted.length === 0) return jsonError("Member not found", 404);
  return Response.json({ ok: true });
}
