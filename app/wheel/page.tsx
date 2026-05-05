"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    <div className="mx-auto max-w-lg px-4 py-10">
      <header className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Footable
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Duo wheel
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add everyone who showed up, spin once, and get random pairs for 2v2
          nights.
        </p>
      </header>

      <Card className="mb-6 overflow-hidden">
        <CardHeader>
          <CardTitle>Wheel</CardTitle>
          <CardDescription>
            Names are shuffled into pairs when the spin finishes — the wheel is
            for fun.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div
            className="relative size-56 rounded-full border-4 border-foreground/10 shadow-sm"
            style={{
              background: segments.length
                ? `conic-gradient(${segments
                    .map(
                      (_, i) =>
                        `oklch(${0.92 - (i % 3) * 0.04} 0.02 ${200 + i * 40}) ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`,
                    )
                    .join(", ")})`
                : "oklch(0.96 0 0)",
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 2.2s cubic-bezier(0.2, 0.8, 0.2, 1)"
                : undefined,
            }}
          >
            <div className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-card shadow-md" />
          </div>
          <Button
            type="button"
            disabled={spinning || players.length < 2}
            onClick={spin}
          >
            {spinning ? "Spinning…" : "Spin"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="pname">Name</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Gamertag"
              />
            </div>
            <Button type="button" onClick={add}>
              Add
            </Button>
          </div>
          {players.length === 0 ? (
            <p className="text-xs text-muted-foreground">No players yet.</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Pairs</CardTitle>
            <CardDescription>Use these duos in your tournament setup.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {pairs.map(([a, b], i) => (
                <li
                  key={`${a}-${b}-${i}`}
                  className="flex justify-between rounded-md border border-border/80 px-3 py-2"
                >
                  <span className="font-medium">{a}</span>
                  <span className="text-muted-foreground">&amp;</span>
                  <span className="font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-10 text-center">
        <Link href="/" className={buttonVariants({ variant: "link" })}>
          Back home
        </Link>
      </p>
    </div>
  );
}
