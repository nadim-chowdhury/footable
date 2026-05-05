import { jsonError } from "@/lib/api-errors";
import { requireTournamentPin } from "@/lib/route-auth";
import { getSql } from "@/lib/db";
import { loadTournamentByPublicId } from "@/lib/tournament-data";
import { verifyPin } from "@/lib/pin";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(request: Request, context: Ctx) {
  const { publicId } = await context.params;
  const sql = getSql();
  const tournament = await loadTournamentByPublicId(sql, publicId);
  if (!tournament) return jsonError("Tournament not found", 404);
  if (tournament.completed_at)
    return jsonError("Tournament is already completed", 400);

  const pin = request.headers.get("x-footable-pin")?.trim();
  if (!pin) return jsonError("PIN required", 401);
  const valid = await verifyPin(pin, tournament.pin_hash);
  if (!valid) return jsonError("Invalid PIN", 403);

  await sql`update tournaments set completed_at = now() where id = ${tournament.id}`;

  return Response.json({ ok: true, completedAt: new Date().toISOString() });
}
