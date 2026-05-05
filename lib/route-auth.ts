import { getSql } from "@/lib/db";
import { jsonError } from "@/lib/api-errors";
import { verifyPin } from "@/lib/pin";
import { loadTournamentByPublicId } from "@/lib/tournament-data";

export async function requireTournamentPin(publicId: string, request: Request) {
  const sql = getSql();
  const tournament = await loadTournamentByPublicId(sql, publicId);
  if (!tournament) {
    return { ok: false as const, response: jsonError("Tournament not found", 404) };
  }
  const pin = request.headers.get("x-footable-pin")?.trim();
  if (!pin) {
    return { ok: false as const, response: jsonError("PIN required", 401) };
  }
  const valid = await verifyPin(pin, tournament.pin_hash);
  if (!valid) {
    return { ok: false as const, response: jsonError("Invalid PIN", 403) };
  }
  return { ok: true as const, sql, tournament };
}
