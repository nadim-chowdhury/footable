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

  const addMember = async () => {
    const d = memberName.trim();
    if (!d) return;
    const res = await fetchWithPin(`/api/tournaments/${publicId}/members`, {
      method: "POST",
      body: JSON.stringify({ displayName: d }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Failed");
      return;
    }
    setMemberName("");
    toast.success(`${d} added`);
    await onRefresh();
  };
  const removeMember = async (id: string) => {
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
  };
  const removeTeam = async (id: string) => {
    const res = await fetchWithPin(`/api/tournaments/${publicId}/teams/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Failed");
      return;
    }
    toast.success("Team removed");
    await onRefresh();
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
  };
  const generateFixtures = async () => {
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
                  <Badge
                    variant="secondary"
                    className={cn(
                      "gap-1.5 pr-1.5 text-sm",
                      assignedIds.has(m.id) && "opacity-50",
                    )}
                  >
                    <span>{m.display_name}</span>
                    {canEdit && !assignedIds.has(m.id) && (
                      <button
                        type="button"
                        onClick={() => void removeMember(m.id)}
                        className="ml-0.5 rounded-full p-0.5 text-xs text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
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
                <Input
                  id="member"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void addMember()}
                  placeholder="e.g. ProNoodle92"
                />
              </div>
              <Button
                type="button"
                onClick={() => void addMember()}
                className="w-full shrink-0 sm:w-auto"
              >
                Add player
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 dark:border-border/40">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">
            Teams
          </CardTitle>
          <CardDescription>
            {tournament.team_mode === "solo"
              ? "One player per team."
              : "Two players per team."}{" "}
            · {teams.length} team{teams.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
                      className="rounded-md p-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      ✕
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
                {tournament.team_mode === "solo" ? (
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Player
                    </Label>
                    <Select
                      value={mSolo || undefined}
                      onValueChange={(v) => setMSolo(v ?? "")}
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassigned.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Player A
                      </Label>
                      <Select
                        value={mA || undefined}
                        onValueChange={(v) => setMA(v ?? "")}
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {unassigned.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Player B
                      </Label>
                      <Select
                        value={mB || undefined}
                        onValueChange={(v) => setMB(v ?? "")}
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {unassigned.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => void addTeam()}
                  >
                    Add team
                  </Button>
                </div>
              </div>
            </>
          )}
          {!isLocked && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {tournament.format === "league"
                    ? "League needs an even number of teams."
                    : "Knockout supports any count ≥ 2 (byes auto-added)."}
                </p>
                <Button
                  type="button"
                  disabled={
                    !hasPin || tournament.fixtures_generated || teams.length < 2
                  }
                  onClick={() => void generateFixtures()}
                  className="glow-neon"
                >
                  {tournament.fixtures_generated
                    ? "Fixtures locked"
                    : `Generate fixtures (${teams.length} teams)`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
