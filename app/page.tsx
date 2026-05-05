"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"league" | "knockout">("league");
  const [teamMode, setTeamMode] = useState<"solo" | "duo">("duo");
  const [busy, setBusy] = useState(false);

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
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Could not create tournament");
        return;
      }
      if (data.publicId && data.adminPin) {
        sessionStorage.setItem(`footable-pin-${data.publicId}`, data.adminPin);
        toast.success("Tournament created — PIN saved in this browser", {
          duration: 5000,
        });
        router.push(`/t/${data.publicId}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-full max-w-xl flex-col px-4 py-16 md:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.08] to-transparent dark:from-primary/[0.12]"
        aria-hidden
      />
      <header className="relative mb-10 text-center sm:text-left md:mb-12">
        <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-primary dark:bg-primary/15">
          EA FC &amp; friends
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          Footable
        </h1>
        <p className="mt-3 max-w-lg text-pretty text-xs leading-relaxed text-muted-foreground md:text-sm">
          Run leagues and knockouts without spreadsheets. Share one link, keep
          scores in sync, and let the table update itself.
        </p>
      </header>

      <Card className="relative mb-8 border-primary/10 shadow-lg shadow-primary/[0.06] ring-1 ring-black/[0.04] dark:ring-white/[0.06] dark:shadow-black/40">
        <CardHeader className="border-b border-border/60 bg-muted/30 dark:bg-muted/10">
          <CardTitle className="text-base md:text-lg">New tournament</CardTitle>
          <CardDescription className="text-pretty">
            You will get a private 6-digit PIN for editing. Share the page link
            so friends can follow along.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-4 py-6 md:px-8">
          <div className="grid gap-2">
            <Label htmlFor="tname">Name</Label>
            <Input
              id="tname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday night FC"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(value) => {
                  if (value === "league" || value === "knockout") setFormat(value);
                }}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="league">League (table)</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Teams</Label>
              <Select
                value={teamMode}
                onValueChange={(value) => {
                  if (value === "solo" || value === "duo") setTeamMode(value);
                }}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo (1v1)</SelectItem>
                  <SelectItem value="duo">Duo (2v2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={() => void create()}
            >
              {busy ? "Creating…" : "Create tournament"}
            </Button>
            <Link
              href="/wheel"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Random duo wheel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
