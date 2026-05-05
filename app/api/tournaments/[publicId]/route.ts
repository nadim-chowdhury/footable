import { jsonError } from "@/lib/api-errors";
import { getSql } from "@/lib/db";
import { requireTournamentPin } from "@/lib/route-auth";
import {
  loadTournamentBundle,
  loadTournamentByPublicId,
} from "@/lib/tournament-data";

type Ctx = { params: Promise<{ publicId: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { publicId } = await context.params;
  const sql = getSql();
  const row = await loadTournamentByPublicId(sql, publicId);
  if (!row) return jsonError("Tournament not found", 404);

  const { pin_hash: _pin, ...tournament } = row;
  const bundle = await loadTournamentBundle(sql, row.id);

  return Response.json({
    tournament,
    ...bundle,
  });
}

export async function PATCH(request: Request, context: Ctx) {
  const { publicId } = await context.params;
  const auth = await requireTournamentPin(publicId, request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const name = String((body as { name?: string }).name ?? "").trim();
  if (!name) return jsonError("name is required", 400);

  await auth.sql`update tournaments set name = ${name} where id = ${auth.tournament.id}`;
  return Response.json({ ok: true });
}
