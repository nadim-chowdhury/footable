"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type Member = { id: string; display_name: string };
type Pair = { a: Member; b: Member | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WheelDialog({
  open,
  onOpenChange,
  unassignedMembers,
  onSavePairs,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  unassignedMembers: Member[];
  onSavePairs: (pairs: Pair[]) => Promise<void>;
}) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [saving, setSaving] = useState(false);

  const segments = useMemo(() => unassignedMembers, [unassignedMembers]);

  // Reset when dialog opens
  if (
    open &&
    pairs.length === 0 &&
    rotation === 0 &&
    unassignedMembers.length > 0
  ) {
    // Just ensuring we don't hold old state
  }

  const spin = () => {
    if (unassignedMembers.length < 2) {
      toast.error("Add at least two players to spin");
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
      const shuffled = shuffle(unassignedMembers);
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

  const handleSave = async () => {
    if (pairs.length === 0) return;
    setSaving(true);
    try {
      await onSavePairs(pairs);
      setPairs([]);
      setRotation(0);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o && !spinning && !saving) {
      setPairs([]);
      setRotation(0);
      onOpenChange(false);
    }
  };

  const sliceDeg = segments.length ? 360 / segments.length : 0;
  const segColors = segments.map((_, i) => {
    const hue = 140 + ((i * 37) % 220);
    const chroma = 0.08 + (i % 3) * 0.04;
    const lightness = 0.35 + (i % 4) * 0.08;
    return `oklch(${lightness} ${chroma} ${hue})`;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            Random Duo Wheel
          </DialogTitle>
          <DialogDescription>
            {unassignedMembers.length} players waiting. Spin to pair them up
            automatically!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="relative">
            {/* Pointer */}
            <div
              className="absolute -top-0.5 left-1/2 z-20 -translate-x-1/2 drop-shadow-md"
              aria-hidden
            >
              <div className="size-0 border-x-10 border-t-16 border-x-transparent border-t-primary" />
            </div>
            {/* Wheel */}
            <div
              className="relative size-48 rounded-full p-1 shadow-2xl ring-4 ring-background md:size-56"
              style={{
                background:
                  "conic-gradient(from 180deg at 50% 50%, oklch(0.55 0.12 145 / 0.35), oklch(0.55 0.12 145 / 0.08) 25%, transparent 50%)",
              }}
            >
              <div
                className="relative size-full overflow-hidden rounded-full border-2 border-foreground/10 bg-background/80 shadow-inner backdrop-blur-sm dark:border-white/10 dark:bg-card/90"
                style={{
                  background: segments.length
                    ? `conic-gradient(${segments
                        .map(
                          (_, i) =>
                            `${segColors[i]} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`,
                        )
                        .join(", ")})`
                    : "oklch(0.2 0.02 260)",
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 2.2s cubic-bezier(0.2, 0.82, 0.15, 1)"
                    : undefined,
                }}
              >
                <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/15 to-transparent dark:from-white/5" />
                <div className="absolute top-1/2 left-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-card font-heading text-sm font-black text-primary shadow-lg">
                  FC
                </div>
              </div>
            </div>
          </div>

          {pairs.length === 0 ? (
            <Button
              type="button"
              disabled={spinning || unassignedMembers.length < 2}
              onClick={spin}
              className="glow-neon w-full font-heading font-bold"
              size="lg"
            >
              {spinning ? "Spinning…" : "Spin for duos"}
            </Button>
          ) : (
            <div className="w-full flex flex-col gap-4 animate-slide-up">
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                {pairs.map((pair, i) => (
                  <div
                    key={`${pair.a.id}-${pair.b?.id ?? "solo"}-${i}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2",
                      pair.b
                        ? "border-border/80 bg-muted/20"
                        : "border-chart-4/30 bg-chart-4/10",
                    )}
                  >
                    <span className="font-semibold text-sm">
                      {pair.a.display_name}
                    </span>
                    {pair.b ? (
                      <>
                        <Badge
                          variant="secondary"
                          className="text-[0.6rem] uppercase tracking-widest mx-2 shrink-0"
                        >
                          duo
                        </Badge>
                        <span className="font-semibold text-sm text-right">
                          {pair.b.display_name}
                        </span>
                      </>
                    ) : (
                      <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30 text-[0.6rem] uppercase tracking-widest shrink-0">
                        solo
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                className="w-full font-heading font-bold"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? <Spinner /> : "Add to tournament"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
