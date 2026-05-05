"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getTournamentPin } from "@/lib/pin-storage";
import { TournamentHeader } from "@/components/tournament/header";
import { SquadPanel } from "@/components/tournament/squad-panel";
import { FixturesPanel } from "@/components/tournament/fixtures-panel";
import { StandingsTable } from "@/components/tournament/standings-table";
import { BracketView } from "@/components/tournament/bracket-view";
import { PinDialog } from "@/components/tournament/pin-dialog";
import { CompleteDialog } from "@/components/tournament/complete-dialog";
import { Spinner } from "@/components/ui/spinner";

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
  is_bye: boolean;
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
  completed_at: string | null;
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
  const [completeOpen, setCompleteOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  const checkPin = useCallback(() => {
    setHasPin(!!getTournamentPin(publicId));
  }, [publicId]);

  const fetchWithPin = useCallback(
    async (input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const pin = getTournamentPin(publicId);
      if (pin) headers.set("x-footable-pin", pin);
      if (init?.body && !headers.has("content-type"))
        headers.set("content-type", "application/json");
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
    setBundle((await res.json()) as Bundle);
  }, [publicId]);

  useEffect(() => {
    checkPin();
  }, [checkPin]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const tournamentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/t/${publicId}`;
  }, [publicId]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const res = await fetchWithPin(`/api/tournaments/${publicId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Could not complete");
        return;
      }
      toast.success("Tournament completed!");
      setCompleteOpen(false);
      await refresh();
    } finally {
      setIsCompleting(false);
    }
  };

  if (loadError || !bundle) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4">
        {!loadError && <Spinner className="size-8 text-primary" />}
        {/* <p className="text-sm text-muted-foreground text-center">
          {loadError ?? "Loading tournament details…"}
        </p> */}
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Home
        </Link>
      </div>
    );
  }

  const { tournament, members, teams, fixtures, standings } = bundle;
  const labelByTeam = new Map(teams.map((t) => [t.id, t.label]));
  const isCompleted = !!tournament.completed_at;

  return (
    <div className="relative px-4 py-10 md:px-6">
      {/* <div
        className="pointer-events-none absolute inset-x-0 top-0 w-full h-full bg-linear-to-b from-primary/8 to-transparent dark:from-primary/12"
        aria-hidden
      /> */}

      <section className="max-w-3xl mx-auto">
        <TournamentHeader
          tournament={tournament}
          hasPin={hasPin}
          publicId={publicId}
          tournamentUrl={tournamentUrl}
          onUnlock={() => setPinOpen(true)}
          onComplete={() => setCompleteOpen(true)}
          onRefresh={refresh}
          fetchWithPin={fetchWithPin}
        />

        <Tabs defaultValue="squad" className="gap-4">
          <TabsList variant="line" className="w-full min-w-0 justify-start">
            <TabsTrigger value="squad">Squad</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            {tournament.format === "league" ? (
              <TabsTrigger value="table">Table</TabsTrigger>
            ) : (
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="squad">
            <SquadPanel
              tournament={tournament}
              members={members}
              teams={teams}
              hasPin={hasPin}
              publicId={publicId}
              onRefresh={refresh}
              fetchWithPin={fetchWithPin}
            />
          </TabsContent>

          <TabsContent value="fixtures">
            <FixturesPanel
              fixtures={fixtures}
              hasPin={hasPin}
              publicId={publicId}
              isCompleted={isCompleted}
              onSaved={refresh}
              fetchWithPin={fetchWithPin}
            />
          </TabsContent>

          <TabsContent value="table">
            <StandingsTable standings={standings} labelByTeam={labelByTeam} />
          </TabsContent>

          <TabsContent value="bracket">
            <BracketView fixtures={fixtures} />
          </TabsContent>
        </Tabs>

        <PinDialog
          open={pinOpen}
          onOpenChange={setPinOpen}
          publicId={publicId}
          tournamentName={tournament.name}
          onPinSaved={checkPin}
        />
        <CompleteDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          onConfirm={() => void handleComplete()}
          isCompleting={isCompleting}
        />
      </section>

      <footer className="mt-16 border-t border-border/40 pt-8 text-center text-xs text-muted-foreground">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://www.twitch.tv/gxlieo"
            target="_blank"
            rel="noreferrer"
            className="font-semibold transition-colors hover:text-primary"
          >
            Twitch
          </a>
          <a
            href="https://www.youtube.com/@gxlieo"
            target="_blank"
            rel="noreferrer"
            className="font-semibold transition-colors hover:text-primary"
          >
            YouTube
          </a>
          <a
            href="https://www.tiktok.com/@gxlieo"
            target="_blank"
            rel="noreferrer"
            className="font-semibold transition-colors hover:text-primary"
          >
            TikTok
          </a>
          <a
            href="https://www.facebook.com/gxlieo"
            target="_blank"
            rel="noreferrer"
            className="font-semibold transition-colors hover:text-primary"
          >
            Facebook
          </a>
        </div>
        <Link
          href="/"
          className="underline-offset-4 hover:underline hover:text-primary transition-colors"
        >
          Footable
        </Link>
      </footer>
    </div>
  );
}
