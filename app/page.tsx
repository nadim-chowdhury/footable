"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { listPinnedTournaments, saveTournamentPin } from "@/lib/pin-storage";

type TournamentMeta = { publicId: string; name: string; savedAt: number };

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"league" | "knockout">("league");
  const [teamMode, setTeamMode] = useState<"solo" | "duo">("solo");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<TournamentMeta[]>([]);

  useEffect(() => {
    setSaved(listPinnedTournaments());
  }, []);

  const create = async () => {
    const n = name.trim();
    if (!n) {
      toast.error("Give your tournament a name");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n, format, teamMode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        publicId?: string;
        adminPin?: string;
        name?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Could not create tournament");
        return;
      }
      if (data.publicId && data.adminPin) {
        saveTournamentPin(data.publicId, data.adminPin, data.name ?? n);
        toast.success(`Tournament created! Your PIN: ${data.adminPin}`, {
          duration: 8000,
          description:
            "PIN saved in this browser. Share the link for others to view.",
        });
        router.push(`/t/${data.publicId}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-full max-w-2xl flex-col px-4 py-12 md:px-6 md:py-20">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-primary/8 via-primary/3 to-transparent dark:from-primary/15 dark:via-primary/5"
        aria-hidden
      />

      {/* Hero */}
      <header className="animate-slide-up relative mb-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary dark:bg-primary/15 dark:border-primary/30">
          <span className="inline-block size-1.5 rounded-full bg-primary animate-glow-pulse" />
          EA Sports FC Tournament Manager
        </div>
        <h1 className="font-heading text-4xl font-black tracking-tighter md:text-6xl">
          <span className="bg-linear-to-r from-primary via-neon to-primary bg-clip-text text-transparent">
            FOOTABLE
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          Run leagues and knockouts without spreadsheets. Create a tournament,
          share the link, and let the table update itself.
        </p>
      </header>

      {/* Create Tournament */}
      <Card
        className="animate-slide-up relative mb-8 overflow-hidden border-primary/10 shadow-xl shadow-primary/6 ring-1 ring-black/4 dark:border-primary/15 dark:ring-white/4 dark:shadow-primary/8"
        style={{ animationDelay: "80ms" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader className="border-b border-border/60 bg-muted/30 dark:bg-muted/10">
          <CardTitle className="font-heading text-lg font-bold tracking-tight md:text-xl">
            New Tournament
          </CardTitle>
          <CardDescription className="text-pretty">
            You&apos;ll get a private 6-digit PIN for editing. Share the page
            link so friends can follow along.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-5 py-7 md:px-8">
          {/* Name */}
          <div className="grid gap-2">
            <Label
              htmlFor="tname"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Tournament Name
            </Label>
            <Input
              id="tname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday Night FC"
              className="h-11 text-base"
              onKeyDown={(e) => e.key === "Enter" && void create()}
            />
          </div>

          {/* Mode Selection */}
          <div className="grid gap-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Team Mode
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTeamMode("solo")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200",
                  teamMode === "solo"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 glow-neon-sm"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-2xl transition-colors",
                    teamMode === "solo" ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  👤
                </div>
                <div>
                  <div className="font-heading text-sm font-bold">Solo</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    1 v 1
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTeamMode("duo")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200",
                  teamMode === "duo"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 glow-neon-sm"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-2xl transition-colors",
                    teamMode === "duo" ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  👥
                </div>
                <div>
                  <div className="font-heading text-sm font-bold">Duo</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    2 v 2
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="grid gap-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Format
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("league")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200",
                  format === "league"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 glow-neon-sm"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-2xl transition-colors",
                    format === "league" ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  🏆
                </div>
                <div>
                  <div className="font-heading text-sm font-bold">League</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    Round-robin table
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormat("knockout")}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-center transition-all duration-200",
                  format === "knockout"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 glow-neon-sm"
                    : "border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-2xl transition-colors",
                    format === "knockout" ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  ⚡
                </div>
                <div>
                  <div className="font-heading text-sm font-bold">Knockout</div>
                  <div className="text-[0.65rem] text-muted-foreground">
                    Elimination bracket
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              size="lg"
              className="w-full font-heading text-base font-bold tracking-wide glow-neon"
              disabled={busy}
              onClick={() => void create()}
            >
              {busy ? "Creating…" : "Create Tournament"}
            </Button>
            {teamMode === "duo" && (
              <Link href="/wheel">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  🎡 Random Duo Wheel
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Tournaments */}
      {saved.length > 0 && (
        <Card
          className="animate-slide-up border-border/60 bg-card/60 backdrop-blur-sm"
          style={{ animationDelay: "160ms" }}
        >
          <CardHeader>
            <CardTitle className="font-heading text-base font-bold">
              Your Tournaments
            </CardTitle>
            <CardDescription>
              Tournaments with PINs saved in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="stagger-children space-y-2">
              {saved
                .sort((a, b) => b.savedAt - a.savedAt)
                .map((t) => (
                  <li key={t.publicId}>
                    <Link
                      href={`/t/${t.publicId}`}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                          {t.name}
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground font-mono">
                          {t.publicId.slice(0, 8)}…
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[0.6rem]"
                      >
                        PIN saved
                      </Badge>
                    </Link>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-muted-foreground">
        <p className="opacity-60">
          Built for EA FC nights · PIN-protected · Shareable links
        </p>
      </footer>
    </div>
  );
}
