import { jsonError } from "@/lib/api-errors";
import { requireTournamentPin } from "@/lib/route-auth";

type Ctx = { params: Promise<{ publicId: string; teamId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const { publicId, teamId } = await context.params;
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
  const label = String((body as { label?: string }).label ?? "").trim();
  if (!label) return jsonError("label is required", 400);

  const updated = await auth.sql`
    update teams set label = ${label}
    where id = ${teamId}::uuid and tournament_id = ${auth.tournament.id}
    returning id
  `;
  if (updated.length === 0) return jsonError("Team not found", 404);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: Ctx) {
  const { publicId, teamId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  if (auth.tournament.fixtures_generated) {
    return jsonError("Tournament is locked after fixtures are generated", 400);
  }

  const deleted = await auth.sql`
    delete from teams
    where id = ${teamId}::uuid and tournament_id = ${auth.tournament.id}
    returning id
  `;
  if (deleted.length === 0) return jsonError("Team not found", 404);
  return Response.json({ ok: true });
}
