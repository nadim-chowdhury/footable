"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cardSurface =
  "border-primary/10 shadow-lg shadow-primary/[0.06] ring-1 ring-black/[0.04] dark:border-primary/15 dark:ring-white/[0.04] dark:shadow-primary/[0.08]";

type Pair = { a: string; b: string | null };

export default function WheelPage() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const segments = useMemo(() => players, [players]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (players.includes(n)) {
      toast.error("Already in the list");
      return;
    }
    setPlayers((p) => [...p, n]);
    setName("");
  };
  const remove = (p: string) => {
    setPlayers((list) => list.filter((x) => x !== p));
    setPairs([]);
  };

  const spin = () => {
    if (players.length < 2) {
      toast.error("Add at least two players");
      return;
    }
    setSpinning(true);
    setPairs([]);
    const extra = 360 * (3 + Math.floor(Math.random() * 3));
    const slice = 360 / Math.max(segments.length, 1);
    const target =
      Math.floor(Math.random() * segments.length) * slice + slice / 2;
    setRotation((r) => r + extra + target);

    window.setTimeout(() => {
      const shuffled = shuffle(players);
      const next: Pair[] = [];
      let i = 0;
      for (; i + 1 < shuffled.length; i += 2) {
        next.push({ a: shuffled[i], b: shuffled[i + 1] });
      }
      if (i < shuffled.length) {
        next.push({ a: shuffled[i], b: null }); // Odd player = solo team
      }
      setPairs(next);
      setSpinning(false);
      const odd = shuffled.length % 2 !== 0;
      toast.success(
        odd ? "Teams drawn — last player goes solo!" : "Teams drawn!",
      );
    }, 2400);
  };

  const sliceDeg = segments.length ? 360 / segments.length : 0;
  // Generate colors for wheel segments
  const segColors = segments.map((_, i) => {
    const hue = 140 + ((i * 37) % 220);
    const chroma = 0.08 + (i % 3) * 0.04;
    const lightness = 0.35 + (i % 4) * 0.08;
    return `oklch(${lightness} ${chroma} ${hue})`;
  });

  return (
    <div className="relative mx-auto max-w-xl px-4 pb-20 pt-12 md:max-w-2xl md:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-primary/8 to-transparent dark:from-primary/14"
        aria-hidden
      />

      <header className="animate-slide-up relative mb-10 md:mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary dark:bg-primary/15">
          <span className="inline-block size-1.5 rounded-full bg-primary animate-glow-pulse" />
          Footable · Duo Draw
        </div>
        <h1 className="font-heading text-2xl font-black tracking-tight md:text-3xl">
          Random Duo Wheel
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          Drop in every gamertag, hit spin, and get fair 2v2 pairs. Odd count?
          Last player goes solo.
        </p>
      </header>

      <Card
        className={cn(
          "animate-slide-up relative mb-8 overflow-hidden",
          cardSurface,
        )}
        style={{ animationDelay: "60ms" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
          <CardTitle className="font-heading text-base font-bold md:text-lg">
            Spin
          </CardTitle>
          <CardDescription>
            The wheel is eye candy — pairs are a fresh shuffle when it stops.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 px-4 py-8 md:px-8">
          <div className="relative">
            {/* Pointer */}
            <div
              className="absolute -top-0.5 left-1/2 z-20 -translate-x-1/2 drop-shadow-md"
              aria-hidden
            >
              <div className="size-0 border-x-10 border-t-16 border-x-transparent border-t-primary md:border-x-12 md:border-t-18" />
            </div>
            {/* Wheel */}
            <div
              className="relative size-64 rounded-full p-1 shadow-2xl ring-4 ring-background md:size-72 md:p-1.5"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, oklch(0.55 0.12 145 / 0.35), oklch(0.55 0.12 145 / 0.08) 25%, transparent 50%)",
              }}
            >
              <div
                className="relative size-full overflow-hidden rounded-full border-2 border-foreground/10 bg-background/80 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-card/90"
                style={{
                  background: segments.length
                    ? `conic-gradient(${segments.map((_, i) => `${segColors[i]} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`).join(", ")})`
                    : "oklch(0.2 0.02 260)",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 2.2s cubic-bezier(0.2, 0.82, 0.15, 1)"
                    : undefined,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/15 to-transparent dark:from-white/5" />
                <div className="absolute top-1/2 left-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-card font-heading text-sm font-black text-primary shadow-lg md:size-16">
                  FC
                </div>
              </div>
            </div>
          </div>
          <Button
            type="button"
            disabled={spinning || players.length < 2}
            onClick={spin}
            className="self-center glow-neon font-heading font-bold"
          >
            {spinning ? "Spinning…" : "🎡 Spin for duos"}
          </Button>
        </CardContent>
      </Card>

      <Card
        className={cn("animate-slide-up mb-8", cardSurface)}
        style={{ animationDelay: "120ms" }}
      >
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
          <CardTitle className="font-heading text-base font-bold md:text-lg">
            Gamertags
          </CardTitle>
          <CardDescription>
            Add everyone playing tonight. Odd count is OK — last player goes
            solo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-3">
            <Label htmlFor="pname" className="text-xs text-muted-foreground">
              Gamertag or name
            </Label>
            <Input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. ProNoodle92"
            />
            <Button type="button" onClick={add} className="w-full">
              Add to list
            </Button>
          </div>
          {players.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-3 py-4 text-center text-sm text-muted-foreground">
              No players yet.
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {players.map((p) => (
                <li key={p}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => remove(p)}
                    title="Remove"
                    className="rounded-full border border-border/80 gap-1"
                  >
                    {p} <span className="text-muted-foreground">×</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            {players.length} player{players.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {pairs.length > 0 && (
        <Card className={cn("animate-scale-in", cardSurface)}>
          <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
            <CardTitle className="font-heading text-base font-bold md:text-lg">
              Tonight&apos;s Teams
            </CardTitle>
            <CardDescription>
              Copy these into your tournament as teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-4 md:px-8">
            <ul className="space-y-3 stagger-children">
              {pairs.map((pair, i) => (
                <li
                  key={`${pair.a}-${pair.b ?? "solo"}-${i}`}
                  className={cn(
                    "rounded-xl border border-border/80 px-4 py-3",
                    pair.b
                      ? "bg-linear-to-r from-muted/30 to-transparent dark:from-muted/15"
                      : "bg-chart-4/5 border-chart-4/20",
                  )}
                >
                  {pair.b ? (
                    <div className="grid grid-cols-3 place-items-center gap-3">
                      <span className="font-semibold">{pair.a}</span>
                      <Badge
                        variant="secondary"
                        className="text-[0.6rem] font-bold uppercase tracking-widest"
                      >
                        duo
                      </Badge>
                      <span className="text-right font-semibold">{pair.b}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold">{pair.a}</span>
                      <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30 text-[0.6rem] font-bold uppercase tracking-widest">
                        solo
                      </Badge>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-12 text-center">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "link" }),
            "text-sm font-medium",
          )}
        >
          ← Back home
        </Link>
      </p>
    </div>
  );
}
