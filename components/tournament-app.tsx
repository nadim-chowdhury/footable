"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function pinStorageKey(publicId: string) {
  return `footable-pin-${publicId}`;
}

type Member = { id: string; display_name: string };
type Team = { id: string; label: string; memberIds: string[] };
type Fixture = {
  id: string;
  round_index: number;
  match_index: number;
  stage: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_label: string | null;
  away_label: string | null;
};
type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};
type Tournament = {
  id: string;
  public_id: string;
  name: string;
  format: string;
  team_mode: string;
  fixtures_generated: boolean;
  created_at: string;
};

type Bundle = {
  tournament: Tournament;
  members: Member[];
  teams: Team[];
  fixtures: Fixture[];
  standings: Standing[];
};

export function TournamentApp({ publicId }: { publicId: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [hasPin, setHasPin] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [mA, setMA] = useState("");
  const [mB, setMB] = useState("");
  const [mSolo, setMSolo] = useState("");

  const fetchWithPin = useCallback(
    async (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const pin = sessionStorage.getItem(pinStorageKey(publicId));
      if (pin) headers.set("x-footable-pin", pin);
      if (init?.body && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      return fetch(input, { ...init, headers });
    },
    [publicId],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/tournaments/${publicId}`);
    if (!res.ok) {
      setLoadError("Could not load tournament.");
      setBundle(null);
      return;
    }
    const data = (await res.json()) as Bundle;
    setBundle(data);
  }, [publicId]);

  useEffect(() => {
    setHasPin(!!sessionStorage.getItem(pinStorageKey(publicId)));
  }, [publicId, pinOpen, bundle]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const savePin = () => {
    const p = pinInput.trim();
    if (!/^\d{6}$/.test(p)) {
      toast.error("PIN must be 6 digits");
      return;
    }
    sessionStorage.setItem(pinStorageKey(publicId), p);
    setPinInput("");
    setPinOpen(false);
    setHasPin(true);
    toast.success("PIN saved on this device");
  };

  const addMember = async () => {
    const displayName = memberName.trim();
    if (!displayName) return;
    const res = await fetchWithPin(`/api/tournaments/${publicId}/members`, {
      method: "POST",
      body: JSON.stringify({ displayName }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Failed to add player");
      return;
    }
    setMemberName("");
    toast.success("Player added");
    await refresh();
  };

  const addTeam = async () => {
    const mode = bundle?.tournament.team_mode;
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
      toast.error(j.error ?? "Failed to add team");
      return;
    }
    setMA("");
    setMB("");
    setMSolo("");
    toast.success("Team added");
    await refresh();
  };

  const generateFixtures = async () => {
    const res = await fetchWithPin(`/api/tournaments/${publicId}/fixtures/generate`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Could not generate fixtures");
      return;
    }
    toast.success("Fixtures generated");
    await refresh();
  };

  const tournamentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/t/${publicId}`;
  }, [publicId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(tournamentUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loadError || !bundle) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground">
          {loadError ?? "Loading…"}
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Home
        </Link>
      </div>
    );
  }

  const { tournament, members, teams, fixtures, standings } = bundle;
  const labelByTeam = new Map(teams.map((t) => [t.id, t.label]));

  const leagueFx = fixtures.filter((f) => f.stage === "league");
  const koFx = fixtures.filter((f) => f.stage === "knockout");
  const koRounds = Array.from(new Set(koFx.map((f) => f.round_index))).sort(
    (a, b) => a - b,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {tournament.name}
            </h1>
            <Badge variant="secondary" className="font-normal">
              {tournament.format === "league" ? "League" : "Knockout"}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {tournament.team_mode === "solo" ? "Solo" : "Duo"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Share-only link — anyone can view. PIN required to edit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            Copy link
          </Button>
          <Button type="button" size="sm" onClick={() => setPinOpen(true)}>
            {hasPin ? "Change PIN" : "Unlock editing"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="squad" className="gap-4">
        <TabsList variant="line" className="w-full min-w-0 justify-start overflow-x-auto">
          <TabsTrigger value="squad">Squad</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          {tournament.format === "league" ? (
            <TabsTrigger value="table">Table</TabsTrigger>
          ) : (
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="squad" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                Add everyone who is playing — then form teams below.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">No players yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {members.map((m) => (
                    <li key={m.id}>
                      <Badge variant="secondary">{m.display_name}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {!tournament.fixtures_generated && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor="member">New player</Label>
                    <Input
                      id="member"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Gamertag or name"
                      disabled={!hasPin}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!hasPin}
                    onClick={() => void addMember()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                {tournament.team_mode === "solo"
                  ? "Each team is one player."
                  : "Each team is two players."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {teams.length === 0 ? (
                <p className="text-xs text-muted-foreground">No teams yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {teams.map((t) => (
                    <li key={t.id} className="flex justify-between gap-2 border-b border-border/60 py-2 last:border-0">
                      <span className="font-medium">{t.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!tournament.fixtures_generated && members.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tournament.team_mode === "solo" ? (
                    <div className="grid gap-1.5">
                      <Label>Player</Label>
                      <Select
                        value={mSolo || undefined}
                        onValueChange={(v) => setMSolo(v ?? "")}
                        disabled={!hasPin}
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
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
                        <Label>Player A</Label>
                        <Select
                          value={mA || undefined}
                          onValueChange={(v) => setMA(v ?? "")}
                          disabled={!hasPin}
                        >
                          <SelectTrigger className="w-full min-w-0">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Player B</Label>
                        <Select
                          value={mB || undefined}
                          onValueChange={(v) => setMB(v ?? "")}
                          disabled={!hasPin}
                        >
                          <SelectTrigger className="w-full min-w-0">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
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
                      size="sm"
                      disabled={!hasPin}
                      onClick={() => void addTeam()}
                    >
                      Add team
                    </Button>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {tournament.format === "league"
                    ? "League needs an even number of teams."
                    : "Knockout needs 2, 4, 8, or 16 teams."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={!hasPin || tournament.fixtures_generated}
                  onClick={() => void generateFixtures()}
                >
                  {tournament.fixtures_generated
                    ? "Fixtures locked"
                    : "Generate fixtures"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixtures" className="flex flex-col gap-4">
          {fixtures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Generate fixtures from the Squad tab when teams are ready.
            </p>
          ) : tournament.format === "league" ? (
            <FixtureList
              fixtures={leagueFx}
              hasPin={hasPin}
              publicId={publicId}
              onSaved={refresh}
              fetchWithPin={fetchWithPin}
            />
          ) : (
            <div className="space-y-6">
              {koRounds.map((r) => (
                <div key={r}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r === koRounds.length - 1
                      ? "Final"
                      : r === koRounds.length - 2
                        ? "Semi-finals"
                        : `Round ${r + 1}`}
                  </h3>
                  <FixtureList
                    fixtures={koFx.filter((f) => f.round_index === r)}
                    hasPin={hasPin}
                    publicId={publicId}
                    onSaved={refresh}
                    fetchWithPin={fetchWithPin}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          {tournament.format !== "league" ? null : standings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Table updates as you enter results.
            </p>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">P</TableHead>
                      <TableHead className="text-right">W</TableHead>
                      <TableHead className="text-right">D</TableHead>
                      <TableHead className="text-right">L</TableHead>
                      <TableHead className="text-right">GF</TableHead>
                      <TableHead className="text-right">GA</TableHead>
                      <TableHead className="text-right">GD</TableHead>
                      <TableHead className="text-right">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row, i) => (
                      <TableRow key={row.teamId}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">
                          {labelByTeam.get(row.teamId) ?? row.teamId}
                        </TableCell>
                        <TableCell className="text-right">{row.played}</TableCell>
                        <TableCell className="text-right">{row.won}</TableCell>
                        <TableCell className="text-right">{row.drawn}</TableCell>
                        <TableCell className="text-right">{row.lost}</TableCell>
                        <TableCell className="text-right">{row.gf}</TableCell>
                        <TableCell className="text-right">{row.ga}</TableCell>
                        <TableCell className="text-right">{row.gd}</TableCell>
                        <TableCell className="text-right font-medium">{row.pts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bracket">
          {tournament.format === "knockout" && koFx.length > 0 ? (
            <div className="space-y-4 text-sm">
              {koRounds.map((r) => (
                <div key={r}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r === koRounds.length - 1 ? "Final" : `Round ${r + 1}`}
                  </h3>
                  <ul className="space-y-2">
                    {koFx
                      .filter((f) => f.round_index === r)
                      .map((f) => (
                        <li
                          key={f.id}
                          className="rounded-md border border-border/80 bg-card px-3 py-2"
                        >
                          <span className="text-muted-foreground">
                            {f.home_label ?? "TBD"}
                          </span>{" "}
                          <span className="text-xs text-muted-foreground">vs</span>{" "}
                          <span className="text-muted-foreground">
                            {f.away_label ?? "TBD"}
                          </span>
                          {f.home_score != null && f.away_score != null ? (
                            <span className="ml-2 font-mono text-xs">
                              {f.home_score}–{f.away_score}
                            </span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No bracket yet.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent showCloseButton className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin PIN</DialogTitle>
            <DialogDescription>
              Enter the 6-digit PIN for this tournament. It is stored only in this
              browser session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </div>
          <DialogFooter>
            <Button type="button" size="sm" onClick={savePin}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="mt-16 border-t border-border pt-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Footable
        </Link>
        {" · "}
        <Link href="/wheel" className="underline-offset-4 hover:underline">
          Duo wheel
        </Link>
      </footer>
    </div>
  );
}

function FixtureList({
  fixtures,
  hasPin,
  publicId,
  onSaved,
  fetchWithPin,
}: {
  fixtures: Fixture[];
  hasPin: boolean;
  publicId: string;
  onSaved: () => Promise<void>;
  fetchWithPin: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const sorted = [...fixtures].sort((a, b) => a.match_index - b.match_index);

  return (
    <ul className="space-y-3">
      {sorted.map((f) => (
        <FixtureRow
          key={f.id}
          fx={f}
          hasPin={hasPin}
          publicId={publicId}
          onSaved={onSaved}
          fetchWithPin={fetchWithPin}
        />
      ))}
    </ul>
  );
}

function FixtureRow({
  fx,
  hasPin,
  publicId,
  onSaved,
  fetchWithPin,
}: {
  fx: Fixture;
  hasPin: boolean;
  publicId: string;
  onSaved: () => Promise<void>;
  fetchWithPin: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [home, setHome] = useState(fx.home_score ?? 0);
  const [away, setAway] = useState(fx.away_score ?? 0);

  useEffect(() => {
    setHome(fx.home_score ?? 0);
    setAway(fx.away_score ?? 0);
  }, [fx.home_score, fx.away_score]);

  const save = async () => {
    const res = await fetchWithPin(
      `/api/tournaments/${publicId}/fixtures/${fx.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ homeScore: home, awayScore: away }),
      },
    );
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Could not save score");
      return;
    }
    toast.success("Score saved");
    await onSaved();
  };

  const ready = fx.home_team_id && fx.away_team_id;

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="min-w-[7rem] font-medium">
          {fx.home_label ?? "TBD"}
        </span>
        <span className="text-xs text-muted-foreground">vs</span>
        <span className="min-w-[7rem] font-medium">
          {fx.away_label ?? "TBD"}
        </span>
      </div>
      {ready ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <Label>Home</Label>
            <Input
              className="w-16 font-mono"
              type="number"
              min={0}
              value={home}
              onChange={(e) => setHome(Number(e.target.value))}
              disabled={!hasPin}
            />
          </div>
          <div className="grid gap-1">
            <Label>Away</Label>
            <Input
              className="w-16 font-mono"
              type="number"
              min={0}
              value={away}
              onChange={(e) => setAway(Number(e.target.value))}
              disabled={!hasPin}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!hasPin}
            onClick={() => void save()}
          >
            Save
          </Button>
        </div>
      ) : fx.stage === "knockout" ? (
        <p className="text-xs text-muted-foreground">
          Waiting for previous knockout results…
        </p>
      ) : null}
    </li>
  );
}
