"use client";

import { useState } from "react";
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
  onSubmit?: () => void | Promise<void>;
  dialogClassName?: string;
  bodyClassName?: string;
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
  dialogClassName,
  bodyClassName,
}: ModalFormShellProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const submitPending = Boolean(isSubmitting || internalSubmitting);

  const handleSubmit = async () => {
    if (!onSubmit || submitPending) {
      return;
    }

    try {
      setInternalSubmitting(true);
      await onSubmit();
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClassName ?? "flex max-h-[90vh] flex-col gap-0 sm:max-w-[700px]"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className={bodyClassName ?? "max-h-[70vh] space-y-4 overflow-y-auto bg-white py-5 pl-1 pr-3 text-slate-900"}>
          {children}
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={submitPending}>
            {submitPending ? "Working..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
