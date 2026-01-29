"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function CommandDialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    (window as any).__openCmd = () => onOpenChange(true);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        {children}
      </DialogContent>
    </Dialog>
  );
}
