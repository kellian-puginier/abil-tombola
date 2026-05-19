"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatEUR } from "@/lib/pricing";
import type { TicketWithBuyer } from "@/lib/types";

export default function CartBar({ tickets }: { tickets: TicketWithBuyer[] }) {
  const count = useCartStore((s) => s.ticketCount);
  const total = useCartStore((s) => s.optimalPrice);
  const breakdown = useCartStore((s) => s.priceBreakdown);
  const selectedIds = useCartStore((s) => s.selectedTicketIds);
  const clear = useCartStore((s) => s.clearCart);

  if (count === 0) return null;

  const selected = tickets.filter((t) => selectedIds.includes(t.id));
  const discounted = selected.filter((t) => t.discount_price != null);
  const discountSum = discounted.reduce((acc, t) => acc + Number(t.discount_price), 0);
  const adjustedTotal =
    discounted.length === 0
      ? total
      : (() => {
          const reg = count - discounted.length;
          const fives = Math.floor(reg / 5);
          const rem = reg % 5;
          const threes = Math.floor(rem / 3);
          const ones = rem % 3;
          return fives * 7 + threes * 5 + ones * 2 + discountSum;
        })();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t"
      style={{ backgroundColor: "oklch(1 0 0 / 0.95)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            {count} ticket{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </p>
          {breakdown && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{breakdown}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="label">Total</p>
            <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>
              {formatEUR(adjustedTotal)}
            </p>
          </div>
          <button onClick={clear} className="btn-outline !px-3 !py-2 text-sm">
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
