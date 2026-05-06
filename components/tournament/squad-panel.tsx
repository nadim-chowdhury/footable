"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WheelDialog } from "./wheel-dialog";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";

type Member = { id: string; display_name: string };
type Team = { id: string; label: string; memberIds: string[] };
type Tournament = {
  id: string;
  format: string;
  team_mode: string;
  fixtures_generated: boolean;
  completed_at: string | null;
};

export function SquadPanel({
  tournament,
  members,
  teams,
  hasPin,
  publicId,
  onRefresh,
  fetchWithPin,
}: {
  tournament: Tournament;
  members: Member[];
  teams: Team[];
  hasPin: boolean;
  publicId: string;
  onRefresh: () => Promise<void>;
  fetchWithPin: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [memberName, setMemberName] = useState("");
  const [mA, setMA] = useState("");
  const [mB, setMB] = useState("");
  const [mSolo, setMSolo] = useState("");
  const isLocked = tournament.fixtures_generated || !!tournament.completed_at;
  const canEdit = hasPin && !isLocked;
  const assignedIds = new Set(teams.flatMap((t) => t.memberIds));
  const unassigned = members.filter((m) => !assignedIds.has(m.id));
  const [wheelOpen, setWheelOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const savePairs = async (pairs: { a: Member; b: Member | null }[]) => {
    for (const pair of pairs) {
      const memberIds = pair.b ? [pair.a.id, pair.b.id] : [pair.a.id];
      const res = await fetchWithPin(`/api/tournaments/${publicId}/teams`, {
        method: "POST",
        body: JSON.stringify({ memberIds }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Failed to add team");
      }
    }
    toast.success("Teams generated!");
    await onRefresh();
  };

  const addMember = async () => {
    const d = memberName.trim();
    if (!d || isAdding) return;

    const displayNames = d
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (displayNames.length === 0) return;

    setIsAdding(true);
    try {
      const res = await fetchWithPin(`/api/tournaments/${publicId}/members`, {
        method: "POST",
        body: JSON.stringify({ displayNames }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Failed");
        return;
      }
      setMemberName("");
      toast.success(`${displayNames.length} player(s) added`);
      await onRefresh();
    } finally {
      setIsAdding(false);
    }
  };
  const removeMember = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetchWithPin(
        `/api/tournaments/${publicId}/members/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Failed");
        return;
      }
      toast.success("Player removed");
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };
  const removeTeam = async (id: string) => {
    setDeletingTeamId(id);
    try {
      const res = await fetchWithPin(
        `/api/tournaments/${publicId}/teams/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Failed");
        return;
      }
      toast.success("Team removed");
      await onRefresh();
    } finally {
      setDeletingTeamId(null);
    }
  };
  const addTeam = async () => {
    const mode = tournament.team_mode;
    let memberIds: string[] = [];
    if (mode === "solo") {
      if (!mSolo) {
        toast.error("Pick a player");
        return;
      }
      memberIds = [mSolo];
    } else {
      if (!mA || !mB || mA === mB) {
        toast.error("Pick two different players");
        return;
      }
      memberIds = [mA, mB];
    }

    if (isAddingTeam) return;
    setIsAddingTeam(true);

    try {
      const res = await fetchWithPin(`/api/tournaments/${publicId}/teams`, {
        method: "POST",
        body: JSON.stringify({ memberIds }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Failed");
        return;
      }
      setMA("");
      setMB("");
      setMSolo("");
      toast.success("Team added");
      await onRefresh();
    } finally {
      setIsAddingTeam(false);
    }
  };
  const generateFixtures = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetchWithPin(
        `/api/tournaments/${publicId}/fixtures/generate`,
        { method: "POST" },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Could not generate");
        return;
      }
      toast.success("Fixtures generated!");
      await onRefresh();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 stagger-children">
      <Card className="border-border/60 dark:border-border/40">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">
            Players
          </CardTitle>
          <CardDescription>
            Add everyone playing — then form teams below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No players yet.</p>
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {members.map((m) => (
                <li key={m.id} className="animate-scale-in">
                  <div
                    // variant="secondary"
                    // className={cn(
                    //   "gap-1.5 pr-1.5 text-sm",
                    //   assignedIds.has(m.id) && "opacity-50",
                    // )}
                    className="w-full inline-flex items-center justify-center gap-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors h-10 px-4 py-2 bg-secondary text-secondary-foreground border-l-4 border-primary"
                  >
                    <span className="px-4">{m.display_name}</span>
                    {canEdit &&
                      (!assignedIds.has(m.id) ||
                        tournament.team_mode === "solo") && (
                        <button
                          type="button"
                          onClick={() => void removeMember(m.id)}
                          disabled={deletingId === m.id}
                          className="group inline-flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-destructive/40 disabled:opacity-50 disabled:pointer-events-none"
                          aria-label="Remove member"
                          title="Remove member"
                        >
                          {deletingId === m.id ? (
                            <Spinner className="w-4 h-4 text-destructive" />
                          ) : (
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              size={16}
                              className="text-destructive/70 group-hover:text-destructive transition-colors"
                              strokeWidth={1.8}
                            />
                          )}
                        </button>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Label
                  htmlFor="member"
                  className="text-xs text-muted-foreground"
                >
                  Gamertag
                </Label>
                <Textarea
                  id="member"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. ProNoodle92, Player 2&#10;Player 3"
                  className="min-h-[40px] resize-y"
                  disabled={isAdding}
                />
              </div>
              <Button
                type="button"
                onClick={() => void addMember()}
                className="w-full shrink-0 sm:w-auto min-w-[100px]"
                disabled={isAdding}
              >
                {isAdding ? <Spinner /> : "Add player"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {tournament.team_mode === "duo" && (
        <Card className="border-border/60 dark:border-border/40">
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">
              Teams
            </CardTitle>
            <CardDescription>
              Two players per team. · {teams.length} team
              {teams.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {canEdit &&
              tournament.team_mode === "duo" &&
              unassigned.length >= 2 && (
                <div className="px-1 pt-1 pb-3">
                  <Button
                    type="button"
                    className="w-full h-12 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 hover:text-primary transition-all font-bold text-base shadow-[0_0_20px_-5px_hsl(var(--primary))] rounded-full"
                    onClick={() => setWheelOpen(true)}
                  >
                    Spin for Duos ({unassigned.length} unassigned players)
                  </Button>
                </div>
              )}
            {teams.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No teams yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {teams.map((t, i) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{t.label}</span>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => void removeTeam(t.id)}
                        disabled={deletingTeamId === t.id}
                        className="rounded-md p-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {deletingTeamId === t.id ? (
                          <Spinner className="w-3 h-3" />
                        ) : (
                          "✕"
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canEdit && unassigned.length > 0 && (
              <>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-sm text-muted-foreground">
                      Player A
                    </Label>
                    <Select
                      value={mA || undefined}
                      onValueChange={(v) => setMA(v ?? "")}
                    >
                      <SelectTrigger className="w-full min-w-0 h-14 text-base bg-background border-border/80 py-5">
                        <SelectValue placeholder="Select…">
                          {mA
                            ? members.find((m) => m.id === mA)?.display_name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {unassigned
                          .filter((m) => m.id !== mB)
                          .map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="py-3 text-base cursor-pointer"
                            >
                              {m.display_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-sm text-muted-foreground">
                      Player B
                    </Label>
                    <Select
                      value={mB || undefined}
                      onValueChange={(v) => setMB(v ?? "")}
                    >
                      <SelectTrigger className="w-full min-w-0 h-14 text-base bg-background border-border/80 py-5">
                        <SelectValue placeholder="Select…">
                          {mB
                            ? members.find((m) => m.id === mB)?.display_name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {unassigned
                          .filter((m) => m.id !== mA)
                          .map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="py-3 text-base cursor-pointer"
                            >
                              {m.display_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 mt-2">
                    <Button
                      type="button"
                      variant="default"
                      className="w-full h-11 min-w-[140px] font-semibold text-[15px]"
                      onClick={() => void addTeam()}
                      disabled={isAddingTeam}
                    >
                      {isAddingTeam ? <Spinner /> : "Add manual team"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!isLocked && (
        <Card className="border-border/60 dark:border-border/40">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {tournament.format === "league"
                  ? "League needs an even number of players/teams."
                  : "Knockout supports any count ≥ 2 (byes auto-added)."}
              </p>
              <Button
                type="button"
                disabled={
                  !hasPin ||
                  tournament.fixtures_generated ||
                  teams.length < 2 ||
                  isGenerating
                }
                onClick={() => void generateFixtures()}
                className="glow-neon w-full font-bold font-heading text-base h-12"
              >
                {/* {isGenerating && <Spinner className="mr-2" />} */}
                {tournament.fixtures_generated ? (
                  "Fixtures locked"
                ) : isGenerating ? (
                  <Spinner className="mx-2" />
                ) : (
                  `Generate fixtures (${teams.length} ${tournament.team_mode === "solo" ? "players" : "teams"})`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {wheelOpen && (
        <WheelDialog
          open={wheelOpen}
          onOpenChange={setWheelOpen}
          unassignedMembers={unassigned}
          onSavePairs={savePairs}
        />
      )}
    </div>
  );
}
