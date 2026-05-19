"use client";

import { create } from "zustand";
import { computeOptimalPrice } from "@/lib/pricing";
import type { BuyerInfo } from "@/lib/types";

interface CartState {
  selectedTicketIds: string[];
  buyerInfo: BuyerInfo | null;
  selectedBundleId: string | null;

  ticketCount: number;
  optimalPrice: number;
  priceBreakdown: string;

  toggleTicket: (id: string) => void;
  removeTicket: (id: string) => void;
  clearCart: () => void;

  setBuyerInfo: (info: BuyerInfo) => void;
  clearBuyerInfo: () => void;

  selectBundle: (id: string) => void;
  clearBundle: () => void;
}

function recomputePricing(ids: string[]) {
  const p = computeOptimalPrice(ids.length);
  return {
    ticketCount: ids.length,
    optimalPrice: p.total,
    priceBreakdown: p.breakdown
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  selectedTicketIds: [],
  buyerInfo: null,
  selectedBundleId: null,

  ticketCount: 0,
  optimalPrice: 0,
  priceBreakdown: "",

  toggleTicket: (id) => {
    const current = get().selectedTicketIds;
    const next = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    set({ selectedTicketIds: next, ...recomputePricing(next) });
  },

  removeTicket: (id) => {
    const next = get().selectedTicketIds.filter((t) => t !== id);
    set({ selectedTicketIds: next, ...recomputePricing(next) });
  },

  clearCart: () =>
    set({
      selectedTicketIds: [],
      ticketCount: 0,
      optimalPrice: 0,
      priceBreakdown: ""
    }),

  setBuyerInfo: (info) => set({ buyerInfo: info }),
  clearBuyerInfo: () => set({ buyerInfo: null }),

  selectBundle: (id) => set({ selectedBundleId: id }),
  clearBundle: () => set({ selectedBundleId: null })
}));
