"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import type { CreateCustomerInput, CustomerRecord } from "@/lib/validators/customer";

type CustomerDraftState = {
  customers: CustomerRecord[];
  addCustomer: (input: CreateCustomerInput) => void;
  renameCustomer: (id: string, value: string) => void;
};

export const useCustomerDraftStore = create<CustomerDraftState>((set) => ({
  customers: [],
  addCustomer: (input) =>
    set((state) => ({
      customers: [
        {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          ...input,
        },
        ...state.customers,
      ],
    })),
  renameCustomer: (id, value) =>
    set((state) => ({
      customers: state.customers.map((item) =>
        item.id === id ? { ...item, name: value } : item
      ),
    })),
}));
