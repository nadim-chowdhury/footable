import { jsonError } from "@/lib/api-errors";
import { getSql } from "@/lib/db";
import { generatePlainPin, hashPin } from "@/lib/pin";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const b = body as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const format = b.format;
  const teamMode = b.teamMode ?? b.team_mode;

  if (!name) return jsonError("Name is required", 400);
  if (format !== "league" && format !== "knockout") {
    return jsonError("format must be league or knockout", 400);
  }
  if (teamMode !== "solo" && teamMode !== "duo") {
    return jsonError("teamMode must be solo or duo", 400);
  }

  const plainPin = generatePlainPin();
  const pinHash = await hashPin(plainPin);
  const sql = getSql();

  const rows = (await sql`
    insert into tournaments (name, format, team_mode, pin_hash)
    values (${name}, ${format}, ${teamMode}, ${pinHash})
    returning id, public_id, name, format, team_mode, created_at
  `) as {
    id: string;
    public_id: string;
    name: string;
    format: string;
    team_mode: string;
    created_at: Date;
  }[];

  const row = rows[0];
  if (!row) return jsonError("Failed to create tournament", 500);

  return Response.json({
    id: row.id,
    publicId: row.public_id,
    name: row.name,
    format: row.format,
    teamMode: row.team_mode,
    createdAt: row.created_at,
    adminPin: plainPin,
  });
}
