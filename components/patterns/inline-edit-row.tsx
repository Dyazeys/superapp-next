"use client";

import { startTransition, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InlineEditRowProps = {
  value: string;
  onSave: (value: string) => void;
};

export function InlineEditRow({ value, onSave }: InlineEditRowProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span>{value}</span>
        <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input value={draft} onChange={(event) => setDraft(event.target.value)} className="h-8 min-w-[180px]" />
      <Button
        size="icon-xs"
        onClick={() => {
          startTransition(() => {
            onSave(draft);
            setEditing(false);
          });
        }}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        size="icon-xs"
        variant="outline"
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
