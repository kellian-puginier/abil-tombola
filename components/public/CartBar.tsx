"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatEUR } from "@/lib/pricing";
import type { TicketWithBuyer } from "@/lib/types";

export default function CartBar({ tickets }: { tickets: TicketWithBuyer[] }) {
  const count = useCartStore((s) => s.ticketCount);
  const total = useCartStore((s) => s.optimalPrice);
  const breakdown = useCartStore((s) => s.priceBreakdown);
  const clear = useCartStore((s) => s.clearCart);

  if (count === 0) return null;

  // Adjust total if any selected ticket has a discount_price: we still use
  // the optimal-pack price for non-discounted tickets, but discounted
  // tickets are added as standalone units at their override price.
  const selectedIds = useCartStore.getState().selectedTicketIds;
  const selected = tickets.filter((t) => selectedIds.includes(t.id));
  const discounted = selected.filter((t) => t.discount_price != null);
  const discountSum = discounted.reduce(
    (acc, t) => acc + Number(t.discount_price),
    0
  );
  const adjustedTotal =
    discounted.length === 0
      ? total
      : computeWithDiscounts(count - discounted.length, discountSum);
  const adjustedBreakdown =
    discounted.length === 0
      ? breakdown
      : `${breakdown ? breakdown + " + " : ""}${discounted.length} ticket(s) prix spécial`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-abil-ink">
            {count} ticket{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </p>
          {adjustedBreakdown && (
            <p className="text-xs text-slate-500">{adjustedBreakdown}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="label">Total</p>
            <p className="text-2xl font-black text-abil-green">
              {formatEUR(adjustedTotal)}
            </p>
          </div>
          <button onClick={clear} className="btn-secondary !px-3 !py-2 text-sm">
            Vider
          </button>
          <Link href="/checkout" className="btn-primary">
            Acheter mes tickets →
          </Link>
        </div>
      </div>
    </div>
  );
}

// price for the non-discounted subset + flat addition of discount overrides
function computeWithDiscounts(regular: number, discountSum: number) {
  const fives = Math.floor(regular / 5);
  const rem = regular % 5;
  const threes = Math.floor(rem / 3);
  const ones = rem % 3;
  return fives * 7 + threes * 5 + ones * 2 + discountSum;
}
