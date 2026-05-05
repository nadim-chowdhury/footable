"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export function StandingsTable({
  standings,
  labelByTeam,
}: {
  standings: Standing[];
  labelByTeam: Map<string, string>;
}) {
  if (standings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Table updates as you enter results.
        </p>
      </div>
    );
  }

  const posColor = (i: number) => {
    if (i === 0) return "text-gold";
    if (i === 1) return "text-silver";
    if (i === 2) return "text-bronze";
    return "text-muted-foreground";
  };

  const posBg = (i: number) => {
    if (i === 0) return "bg-gold/10 border-gold/20";
    if (i === 1) return "bg-silver/10 border-silver/20";
    if (i === 2) return "bg-bronze/10 border-bronze/20";
    return "";
  };

  return (
    <Card className="border-border/60 dark:border-border/40 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-10 text-center text-[0.6rem] uppercase tracking-widest">
                  #
                </TableHead>
                <TableHead className="text-[0.6rem] uppercase tracking-widest">
                  Team
                </TableHead>
                <TableHead className="w-10 text-center text-[0.6rem] uppercase tracking-widest">
                  P
                </TableHead>
                <TableHead className="w-10 text-center text-[0.6rem] uppercase tracking-widest">
                  W
                </TableHead>
                <TableHead className="w-10 text-center text-[0.6rem] uppercase tracking-widest">
                  D
                </TableHead>
                <TableHead className="w-10 text-center text-[0.6rem] uppercase tracking-widest">
                  L
                </TableHead>
                <TableHead className="w-12 text-center text-[0.6rem] uppercase tracking-widest">
                  GF
                </TableHead>
                <TableHead className="w-12 text-center text-[0.6rem] uppercase tracking-widest">
                  GA
                </TableHead>
                <TableHead className="w-12 text-center text-[0.6rem] uppercase tracking-widest">
                  GD
                </TableHead>
                <TableHead className="w-12 text-center text-[0.6rem] uppercase tracking-widest font-bold">
                  Pts
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row, i) => (
                <TableRow
                  key={row.teamId}
                  className={cn("border-border/30 transition-colors", posBg(i))}
                >
                  <TableCell
                    className={cn(
                      "text-center font-mono text-sm font-bold",
                      posColor(i),
                    )}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {labelByTeam.get(row.teamId) ?? row.teamId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {row.played}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-win">
                    {row.won}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-draw">
                    {row.drawn}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm text-loss">
                    {row.lost}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {row.gf}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {row.ga}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-mono text-sm font-semibold",
                      row.gd > 0 ? "text-win" : row.gd < 0 ? "text-loss" : "",
                    )}
                  >
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </TableCell>
                  <TableCell className="text-center font-mono text-base font-black text-primary">
                    {row.pts}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
