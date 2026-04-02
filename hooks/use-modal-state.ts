"use client";

import { useState } from "react";

export function useModalState(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);

  return {
    open,
    setOpen,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
    toggleModal: () => setOpen((current) => !current),
  };
}
