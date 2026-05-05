"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tournament = {
  id: string;
  public_id: string;
  name: string;
  format: string;
  team_mode: string;
  fixtures_generated: boolean;
  completed_at: string | null;
};

export function TournamentHeader({
  tournament,
  hasPin,
  publicId,
  tournamentUrl,
  onUnlock,
  onComplete,
  onRefresh,
  fetchWithPin,
}: {
  tournament: Tournament;
  hasPin: boolean;
  publicId: string;
  tournamentUrl: string;
  onUnlock: () => void;
  onComplete: () => void;
  onRefresh: () => Promise<void>;
  fetchWithPin: (input: string, init?: RequestInit) => Promise<Response>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(tournament.name);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(tournamentUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const saveName = async () => {
    const n = editName.trim();
    if (!n || n === tournament.name) {
      setEditing(false);
      return;
    }
    const res = await fetchWithPin(`/api/tournaments/${publicId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: n }),
    });
    if (!res.ok) {
      toast.error("Could not update name");
      return;
    }
    toast.success("Name updated");
    setEditing(false);
    await onRefresh();
  };

  const isCompleted = !!tournament.completed_at;

  return (
    <header className="animate-slide-up relative mb-8 overflow-hidden rounded-xl border border-primary/10 bg-card/80 shadow-lg shadow-primary/4 ring-1 ring-black/4 backdrop-blur-sm dark:border-primary/15 dark:bg-card/60 dark:ring-white/4 dark:shadow-primary/6">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {editing && hasPin ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveName();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="h-9 w-48 font-heading text-lg font-bold"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void saveName()}
                >
                  ✓
                </Button>
              </div>
            ) : (
              <h1
                className={cn(
                  "font-heading text-2xl font-bold tracking-tight md:text-3xl",
                  hasPin &&
                    !isCompleted &&
                    "cursor-pointer hover:text-primary transition-colors",
                )}
                onClick={() => {
                  if (hasPin && !isCompleted) {
                    setEditName(tournament.name);
                    setEditing(true);
                  }
                }}
              >
                {tournament.name}
              </h1>
            )}
            <Badge
              variant="secondary"
              className={cn(
                "font-mono text-[0.6rem] font-bold uppercase tracking-widest",
                tournament.format === "league"
                  ? "bg-chart-2/15 text-chart-2 dark:bg-chart-2/20"
                  : "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20",
              )}
            >
              {tournament.format === "league" ? "League" : "Knockout"}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono text-[0.6rem] uppercase tracking-widest"
            >
              {tournament.team_mode === "solo" ? "Solo" : "Duo"}
            </Badge>
            {isCompleted && (
              <Badge className="animate-badge-pop bg-gold/20 text-gold border-gold/30 text-[0.6rem] font-bold uppercase tracking-widest">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isCompleted
              ? "This tournament is finished. Results are locked."
              : "Share the link — anyone can view. PIN required to edit."}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="gap-1.5"
          >
            <span className="text-xs">📋</span> Copy link
          </Button>
          {!isCompleted && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={onUnlock}
                className="gap-1.5"
              >
                <span className="text-xs">{hasPin ? "🔓" : "🔒"}</span>
                {hasPin ? "Change PIN" : "Unlock"}
              </Button>
              {hasPin && tournament.fixtures_generated && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onComplete}
                  className="gap-1.5"
                >
                  <span className="text-xs">🏁</span> Complete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* PIN indicator */}
      {hasPin && !isCompleted && (
        <div className="border-t border-border/40 bg-primary/5 px-5 py-1.5 dark:bg-primary/10">
          <p className="text-[0.65rem] font-medium text-primary">
            ✓ PIN active — you can edit this tournament
          </p>
        </div>
      )}
    </header>
  );
}
