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
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-16">
      <header className="mb-10 text-center sm:text-left">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          EA FC &amp; friends
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Footable
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Run leagues and knockouts without spreadsheets. Share one link, keep
          scores in sync, and let the table update itself.
        </p>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New tournament</CardTitle>
          <CardDescription>
            You will get a private 6-digit PIN for editing. Share the page link
            so friends can follow along.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
