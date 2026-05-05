"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  "border-primary/10 shadow-lg shadow-primary/[0.06] ring-1 ring-black/[0.04] dark:ring-white/[0.06] dark:shadow-black/40";

export default function WheelPage() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [pairs, setPairs] = useState<[string, string][]>([]);
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
    if (players.length % 2 !== 0) {
      toast.error("Use an even number of players for duos");
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
      const next: [string, string][] = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        next.push([shuffled[i], shuffled[i + 1]]);
      }
      setPairs(next);
      setSpinning(false);
      toast.success("Teams drawn");
    }, 2400);
  };

  const sliceDeg = segments.length ? 360 / segments.length : 0;

  return (
    <div className="relative mx-auto max-w-xl px-4 pb-20 pt-12 md:max-w-2xl md:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.07] to-transparent dark:from-primary/[0.12]"
        aria-hidden
      />

      <header className="relative mb-10 md:mb-12">
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-primary dark:bg-primary/15">
          Footable · Duo draw
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          Random duo wheel
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-xs leading-relaxed text-muted-foreground md:text-sm">
          Drop in every gamertag, hit spin, and get fair 2v2 pairs for EA FC
          night — no arguments about who stacks with who.
        </p>
      </header>

      <Card className={cn("relative mb-8 overflow-hidden", cardSurface)}>
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
          <CardTitle className="text-base md:text-lg">Spin</CardTitle>
          <CardDescription>
            The wheel is eye candy; pairs are a fresh random shuffle when it
            stops.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 px-4 py-8 md:px-8">
          <div className="relative">
            <div
              className="absolute -top-0.5 left-1/2 z-20 -translate-x-1/2 drop-shadow-md"
              aria-hidden
            >
              <div className="size-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-primary md:border-x-[12px] md:border-t-[18px]" />
            </div>
            <div
              className="relative size-64 rounded-full p-1 shadow-2xl ring-4 ring-background md:size-72 md:p-1.5"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, oklch(0.55 0.12 152 / 0.35), oklch(0.55 0.12 152 / 0.08) 25%, transparent 50%)",
              }}
            >
              <div
                className="relative size-full overflow-hidden rounded-full border-2 border-foreground/10 bg-background/80 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-card/90"
                style={{
                  background: segments.length
                    ? `conic-gradient(${segments
                        .map(
                          (_, i) =>
                            `oklch(${0.94 - (i % 4) * 0.03} ${0.04 + (i % 2) * 0.02} ${145 + i * 28}) ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`,
                        )
                        .join(", ")})`
                    : "oklch(0.96 0.02 145)",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 2.2s cubic-bezier(0.2, 0.82, 0.15, 1)"
                    : undefined,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 to-transparent dark:from-white/5" />
                <div className="absolute top-1/2 left-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-card font-mono text-[0.65rem] font-bold text-muted-foreground shadow-lg md:size-16 md:text-xs">
                  FC
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={spinning || players.length < 2}
            onClick={spin}
            className="self-center"
          >
            {spinning ? "Spinning…" : "Spin for random duos"}
          </Button>
        </CardContent>
      </Card>

      <Card className={cn("mb-8", cardSurface)}>
        <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
          <CardTitle className="text-base md:text-lg">Gamertags</CardTitle>
          <CardDescription>
            Add everyone playing tonight — you need an even count to pair up.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-3">
            <Label htmlFor="pname" className="text-foreground/90">
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
            <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-3 text-center text-sm text-muted-foreground">
              No players yet. Start by adding gamertags above.
            </p>
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
                    className="rounded-full border border-border/80"
                  >
                    {p} ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pairs.length > 0 && (
        <Card className={cn(cardSurface)}>
          <CardHeader className="border-b border-border/60 bg-muted/30 pb-4 dark:bg-muted/10">
            <CardTitle className="text-base md:text-lg">Tonight&apos;s duos</CardTitle>
            <CardDescription>
              Copy these into your tournament as duo teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-2 md:px-8">
            <ul className="space-y-3">
              {pairs.map(([a, b], i) => (
                <li
                  key={`${a}-${b}-${i}`}
                  className="grid grid-cols-3 place-items-center gap-3 rounded-xl border border-border/80 bg-gradient-to-r from-muted/40 to-transparent px-4 py-3 dark:from-muted/20"
                >
                  <span className="font-medium">{a}</span>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-primary bg-secondary px-4 py-2 rounded-full">
                    duo
                  </span>
                  <span className="text-right font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-12 text-center">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "link" }), "text-sm font-medium")}
        >
          ← Back home
        </Link>
      </p>
    </div>
  );
}
