"use client";

import type { TicketWithBuyer } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { cn, buyerShortLabel } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";

export default function TicketCard({ ticket }: { ticket: TicketWithBuyer }) {
  const selected = useCartStore((s) =>
    s.selectedTicketIds.includes(ticket.id)
  );
  const toggle = useCartStore((s) => s.toggleTicket);

  const isBundle = ticket.is_bundle_member;
  const discounted = ticket.discount_price != null;

  if (ticket.status === "won") {
    return (
      <div className="card relative overflow-hidden p-4 opacity-90">
        <div className="absolute right-2 top-2 text-2xl">🏆</div>
        <p className="font-display text-xl font-bold leading-tight">
          {ticket.display_name}
        </p>
        {ticket.buyer && (
          <p className="mt-1 text-xs text-amber-700">
            Gagnant&nbsp;: {buyerShortLabel(
              ticket.buyer.buyer_first_name,
              ticket.buyer.buyer_last_name,
              ticket.buyer.buyer_club
            )}
          </p>
        )}
      </div>
    );
  }

  if (ticket.status === "sold") {
    return (
      <div className="card relative overflow-hidden p-4 opacity-70">
        <div className="absolute right-2 top-2 text-xs font-semibold text-slate-400">
          VENDU
        </div>
        <p className="font-display text-xl font-bold leading-tight text-slate-600 line-through">
          {ticket.display_name}
        </p>
        {ticket.buyer && (
          <p className="mt-1 text-xs text-slate-500">
            Pris par {buyerShortLabel(
              ticket.buyer.buyer_first_name,
              ticket.buyer.buyer_last_name,
              ticket.buyer.buyer_club
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(ticket.id)}
      className={cn(
        "card group relative overflow-hidden p-4 text-left transition",
        "hover:-translate-y-0.5 hover:shadow-xl",
        selected && "ring-2 ring-abil-green bg-emerald-50",
        isBundle && "ring-2 ring-abil-gold"
      )}
    >
      {discounted && (
        <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 animate-sparkle">
          Promo
        </span>
      )}
      {isBundle && (
        <span className="absolute right-2 top-2 rounded-full bg-abil-gold px-2 py-0.5 text-[10px] font-bold uppercase text-abil-ink">
          ×5
        </span>
      )}
      <p className="font-display text-xl font-bold leading-tight">
        {ticket.display_name}
      </p>
      {discounted && (
        <p className="mt-2 text-sm font-semibold text-abil-green">
          Prix spécial&nbsp;: {formatEUR(Number(ticket.discount_price))}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500 group-hover:text-abil-green">
        {selected ? "✓ Dans le panier" : "Cliquer pour ajouter"}
      </p>
    </button>
  );
}
