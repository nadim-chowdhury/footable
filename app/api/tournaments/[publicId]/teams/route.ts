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
  const memberIds = (body as { memberIds?: string[] }).memberIds;
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return jsonError("memberIds must be a non-empty array", 400);
  }

  const mode = auth.tournament.team_mode;
  if (mode === "solo" && memberIds.length !== 1) {
    return jsonError("Solo mode requires exactly one member per team", 400);
  }
  if (mode === "duo" && memberIds.length !== 2 && memberIds.length !== 1) {
    return jsonError(
      "Duo mode requires exactly one or two members per team",
      400,
    );
  }

  const uniq = new Set(memberIds);
  if (uniq.size !== memberIds.length) {
    return jsonError("Duplicate members in memberIds", 400);
  }

  const tid = auth.tournament.id;

  const memberRows: { id: string; display_name: string }[] = [];
  for (const mid of memberIds) {
    const rows = (await auth.sql`
      select id, display_name from members
      where tournament_id = ${tid} and id = ${mid}::uuid
    `) as { id: string; display_name: string }[];
    if (!rows[0]) {
      return jsonError("One or more members are not in this tournament", 400);
    }
    memberRows.push(rows[0]);
  }

  for (const mid of memberIds) {
    const taken = await auth.sql`
      select tm.member_id from team_members tm
      join teams t on t.id = tm.team_id
      where t.tournament_id = ${tid} and tm.member_id = ${mid}::uuid
      limit 1
    `;
    if (taken.length > 0) {
      return jsonError("A selected player is already on another team", 400);
    }
  }

  const members = memberRows;

  const label = members.map((m) => m.display_name).join(" & ");

  const teamRows = (await auth.sql`
    insert into teams (tournament_id, label) values (${tid}, ${label})
    returning id, label
  `) as { id: string; label: string }[];
  const team = teamRows[0];
  if (!team) return jsonError("Failed to create team", 500);

  for (const mid of memberIds) {
    await auth.sql`
      insert into team_members (team_id, member_id) values (${team.id}, ${mid}::uuid)
    `;
  }

  return Response.json({
    id: team.id,
    label: team.label,
    memberIds,
  });
}
