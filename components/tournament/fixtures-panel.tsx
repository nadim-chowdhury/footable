"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

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

export function FixturesPanel({
  fixtures,
  hasPin,
  publicId,
  isCompleted,
  onSaved,
  fetchWithPin,
}: {
  fixtures: Fixture[];
  hasPin: boolean;
  publicId: string;
  isCompleted: boolean;
  onSaved: () => Promise<void>;
  fetchWithPin: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const leagueFx = fixtures.filter((f) => f.stage === "league");
  const koFx = fixtures.filter((f) => f.stage === "knockout");
  const isLeague = leagueFx.length > 0;

  if (fixtures.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Generate fixtures from the Squad tab when teams are ready.
        </p>
      </div>
    );
  }

  if (isLeague) {
    // Sort: unplayed first, then by match index
    const sorted = [...leagueFx].sort((a, b) => {
      const aPlayed = a.home_score !== null ? 1 : 0;
      const bPlayed = b.home_score !== null ? 1 : 0;
      if (aPlayed !== bPlayed) return aPlayed - bPlayed;
      return (
        a.round_index * 100 +
        a.match_index -
        (b.round_index * 100 + b.match_index)
      );
    });
    return (
      <div className="space-y-3 stagger-children">
        {sorted.map((f) => (
          <FixtureCard
            key={f.id}
            fx={f}
            hasPin={hasPin && !isCompleted}
            publicId={publicId}
            onSaved={onSaved}
            fetchWithPin={fetchWithPin}
          />
        ))}
      </div>
    );
  }

  // Knockout: group by round
  const rounds = Array.from(new Set(koFx.map((f) => f.round_index))).sort(
    (a, b) => a - b,
  );
  const maxRound = rounds[rounds.length - 1] ?? 0;
  return (
    <div className="space-y-6">
      {rounds.map((r) => (
        <div key={r}>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="inline-block h-px flex-1 bg-border/60" />
            {r === maxRound
              ? "🏆 Final"
              : r === maxRound - 1
                ? "Semi-finals"
                : `Round ${r + 1}`}
            <span className="inline-block h-px flex-1 bg-border/60" />
          </h3>
          <div className="space-y-3">
            {koFx
              .filter((f) => f.round_index === r)
              .map((f) => (
                <FixtureCard
                  key={f.id}
                  fx={f}
                  hasPin={hasPin && !isCompleted}
                  publicId={publicId}
                  onSaved={onSaved}
                  fetchWithPin={fetchWithPin}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FixtureCard({
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHome(fx.home_score ?? 0);
    setAway(fx.away_score ?? 0);
  }, [fx.home_score, fx.away_score]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetchWithPin(
        `/api/tournaments/${publicId}/fixtures/${fx.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ homeScore: home, awayScore: away }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Could not save");
        return;
      }
      toast.success("Score saved");
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const ready = fx.home_team_id && fx.away_team_id;
  const played = fx.home_score !== null && fx.away_score !== null;
  const isBye = fx.is_bye;

  if (isBye) {
    const winner = fx.home_label ?? fx.away_label ?? "TBD";
    return (
      <div className="rounded-lg border border-border/40 bg-muted/5 px-4 py-3 opacity-50">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{winner}</span>
          <span className="text-xs text-muted-foreground italic">
            — BYE (auto-advance)
          </span>
        </div>
      </div>
    );
  }

  const homeIsWinner = played && (fx.home_score ?? 0) > (fx.away_score ?? 0);
  const awayIsWinner = played && (fx.away_score ?? 0) > (fx.home_score ?? 0);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-2 sm:p-4 transition-all flex flex-col justify-center",
        played
          ? "border-border/40 bg-card/60"
          : "border-primary/15 shadow-sm dark:border-primary/20",
      )}
      style={{ minHeight: "4.5rem" }}
    >
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Home */}
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0 justify-end">
          <span
            className={cn(
              "text-xs sm:text-sm font-semibold transition-colors text-right mx-4",
              homeIsWinner
                ? "text-primary"
                : fx.home_score !== null
                  ? "text-muted-foreground"
                  : "text-foreground",
            )}
            title={fx.home_label ?? "TBD"}
          >
            {fx.home_label ?? "TBD"}
          </span>
          {ready ? (
            <Input
              className="w-10 sm:w-14 h-8 sm:h-9 font-mono text-center px-0 sm:px-1 shrink-0"
              type="number"
              min={0}
              max={99}
              value={home}
              onChange={(e) => setHome(Number(e.target.value))}
              disabled={!hasPin}
            />
          ) : (
            fx.home_score !== null && (
              <span className="shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-bold bg-muted text-muted-foreground">
                {fx.home_score}
              </span>
            )
          )}
        </div>

        {/* VS */}
        <span className="shrink-0 rounded-full bg-muted/50 px-1.5 sm:px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          vs
        </span>

        {/* Away */}
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0 justify-start">
          {ready ? (
            <Input
              className="w-10 sm:w-14 h-8 sm:h-9 font-mono text-center px-0 sm:px-1 shrink-0"
              type="number"
              min={0}
              max={99}
              value={away}
              onChange={(e) => setAway(Number(e.target.value))}
              disabled={!hasPin}
            />
          ) : (
            fx.away_score !== null && (
              <span className="shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-bold bg-muted text-muted-foreground">
                {fx.away_score}
              </span>
            )
          )}
          <span
            className={cn(
              "text-xs sm:text-sm font-semibold transition-colors text-left mx-4",
              awayIsWinner
                ? "text-primary"
                : fx.away_score !== null
                  ? "text-muted-foreground"
                  : "text-foreground",
            )}
            title={fx.away_label ?? "TBD"}
          >
            {fx.away_label ?? "TBD"}
          </span>
        </div>

        {/* Action */}
        {ready && hasPin && (
          <div className="shrink-0 pl-1 sm:pl-2 border-l border-border/40 ml-1 sm:ml-0 flex items-center justify-center">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void save()}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              {saving ? (
                <Spinner className="mx-1 sm:mx-2 w-3 h-3 sm:w-4 sm:h-4" />
              ) : played ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        )}
      </div>
      {!ready && fx.stage === "knockout" && (
        <p className="text-[10px] sm:text-xs text-muted-foreground italic text-center mt-1 sm:mt-2">
          Waiting for previous round…
        </p>
      )}
    </div>
  );
}
