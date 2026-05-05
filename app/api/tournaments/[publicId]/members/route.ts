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
  const namesInput = (body as { displayNames?: string[] }).displayNames;
  let namesToProcess: string[] = [];

  if (Array.isArray(namesInput) && namesInput.length > 0) {
    namesToProcess = namesInput.map((n) => String(n).trim()).filter(Boolean);
  } else {
    // fallback for single displayName
    const displayName = String(
      (body as { displayName?: string }).displayName ?? "",
    ).trim();
    if (displayName) namesToProcess.push(displayName);
  }

  if (namesToProcess.length === 0) return jsonError("Names are required", 400);

  // Remove duplicates from the input list itself
  namesToProcess = Array.from(new Set(namesToProcess));

  const existingRows = (await auth.sql`
    select display_name from members
    where tournament_id = ${auth.tournament.id}
  `) as { display_name: string }[];
  const existingSet = new Set(
    existingRows.map((r) => r.display_name.toLowerCase()),
  );

  const newNames = namesToProcess.filter(
    (n) => !existingSet.has(n.toLowerCase()),
  );
  if (newNames.length === 0) {
    return jsonError(
      "All players provided already exist in the tournament",
      400,
    );
  }

  const added = [];
  for (const n of newNames) {
    const rows = (await auth.sql`
      insert into members (tournament_id, display_name)
      values (${auth.tournament.id}, ${n})
      returning id, display_name
    `) as { id: string; display_name: string }[];

    const m = rows[0];
    if (m) {
      if (auth.tournament.team_mode === "solo") {
        await auth.sql`
          with new_team as (
            insert into teams (tournament_id, label)
            values (${auth.tournament.id}, ${m.display_name})
            returning id
          )
          insert into team_members (team_id, member_id)
          select id, ${m.id}::uuid from new_team
        `;
      }
      added.push({ id: m.id, displayName: m.display_name });
    }
  }

  return Response.json({ added });
}
