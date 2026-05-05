"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

export function CompleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  isCompleting?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Complete Tournament?
          </DialogTitle>
          <DialogDescription>
            This will lock all scores and disable further edits. The PIN will no
            longer work for updates. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {/* <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isCompleting}
          >
            {isCompleting ? <Spinner /> : "Complete Tournament"}
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
