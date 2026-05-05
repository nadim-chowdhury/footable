"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTournamentPin, getTournamentPin } from "@/lib/pin-storage";

export function PinDialog({
  open,
  onOpenChange,
  publicId,
  tournamentName,
  onPinSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  publicId: string;
  tournamentName: string;
  onPinSaved: () => void;
}) {
  const [pin, setPin] = useState("");

  const save = () => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) {
      toast.error("PIN must be 6 digits");
      return;
    }
    saveTournamentPin(publicId, p, tournamentName);
    setPin("");
    onOpenChange(false);
    onPinSaved();
    toast.success("PIN saved on this device");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Admin PIN</DialogTitle>
          <DialogDescription>
            Enter the 6-digit PIN for this tournament. It&apos;s stored only in
            this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="••••••"
            className="font-mono text-center text-lg tracking-[0.3em]"
          />
        </div>
        <DialogFooter>
          <Button type="button" size="sm" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
