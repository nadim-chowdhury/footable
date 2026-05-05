"use client";

import { cn } from "@/lib/utils";

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

export function BracketView({ fixtures }: { fixtures: Fixture[] }) {
  const koFx = fixtures.filter((f) => f.stage === "knockout");
  if (koFx.length === 0)
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No bracket yet.</p>
      </div>
    );

  const rounds = Array.from(new Set(koFx.map((f) => f.round_index))).sort(
    (a, b) => a - b,
  );
  const maxRound = rounds[rounds.length - 1] ?? 0;

  const roundLabel = (r: number) => {
    if (r === maxRound) return "Final";
    if (r === maxRound - 1 && maxRound >= 2) return "Semis";
    if (r === maxRound - 2 && maxRound >= 3) return "Quarters";
    return `R${r + 1}`;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((r) => {
          const matchesInRound = koFx
            .filter((f) => f.round_index === r)
            .sort((a, b) => a.match_index - b.match_index);
          return (
            <div key={r} className="flex flex-col">
              <div className="mb-3 text-center">
                <span className="inline-block rounded-full bg-muted/30 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {roundLabel(r)}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {matchesInRound.map((f) => {
                  const played = f.home_score !== null && f.away_score !== null;
                  const homeWin =
                    played && (f.home_score ?? 0) > (f.away_score ?? 0);
                  const awayWin =
                    played && (f.away_score ?? 0) > (f.home_score ?? 0);
                  return (
                    <div
                      key={f.id}
                      className={cn(
                        "w-48 rounded-lg border bg-card overflow-hidden transition-all",
                        f.is_bye
                          ? "opacity-40 border-border/30"
                          : played
                            ? "border-border/50"
                            : "border-primary/20 shadow-sm",
                      )}
                    >
                      <MatchSlot
                        name={f.home_label ?? (f.home_team_id ? "TBD" : "BYE")}
                        score={f.home_score}
                        isWinner={homeWin}
                        position="top"
                      />
                      <div className="h-px bg-border/40" />
                      <MatchSlot
                        name={f.away_label ?? (f.away_team_id ? "TBD" : "BYE")}
                        score={f.away_score}
                        isWinner={awayWin}
                        position="bottom"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchSlot({
  name,
  score,
  isWinner,
  position,
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  position: "top" | "bottom";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors",
        isWinner ? "bg-primary/10 font-bold" : "bg-transparent",
        name === "BYE" && "italic text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "truncate",
          isWinner ? "text-primary" : "text-foreground/80",
        )}
      >
        {name}
      </span>
      {score !== null && (
        <span
          className={cn(
            "shrink-0 font-mono font-bold",
            isWinner ? "text-primary" : "text-muted-foreground",
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
