"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ModalFormShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel?: string;
  children: React.ReactNode;
  isSubmitting?: boolean;
  onSubmit?: () => void;
};

export function ModalFormShell({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save changes",
  children,
  isSubmitting,
  onSubmit,
}: ModalFormShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter showCloseButton>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Working..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
