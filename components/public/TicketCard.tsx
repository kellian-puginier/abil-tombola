"use client";

import type { TicketWithBuyer } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { cn, buyerShortLabel } from "@/lib/utils";
import { formatEUR } from "@/lib/pricing";

export default function TicketCard({ ticket }: { ticket: TicketWithBuyer }) {
  const selected = useCartStore((s) => s.selectedTicketIds.includes(ticket.id));
  const toggle = useCartStore((s) => s.toggleTicket);

  const isBundle = ticket.is_bundle_member;
  const discounted = ticket.discount_price != null;

  const numberBadge = ticket.ticket_number != null ? `N°${ticket.ticket_number}` : null;

  if (ticket.status === "won") {
    return (
      <div className="card relative overflow-hidden p-4 opacity-90">
        <div className="absolute right-2 top-2 text-xl">🏆</div>
        {numberBadge && (
          <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {numberBadge}
          </span>
        )}
        <p className="font-display text-lg font-bold leading-tight">{ticket.display_name}</p>
        {ticket.subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ticket.subtitle}</p>
        )}
        {ticket.buyer && (
          <p className="mt-1 text-xs" style={{ color: "oklch(0.65 0.15 83)" }}>
            Gagnant : {buyerShortLabel(ticket.buyer.buyer_first_name, ticket.buyer.buyer_last_name, ticket.buyer.buyer_club)}
          </p>
        )}
      </div>
    );
  }

  if (ticket.status === "sold") {
    return (
      <div className="card relative overflow-hidden p-4 opacity-60">
        <div className="absolute right-2 top-2 text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>
          Vendu
        </div>
        {numberBadge && (
          <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {numberBadge}
          </span>
        )}
        <p className="font-display text-lg font-bold leading-tight line-through" style={{ color: "var(--muted-foreground)" }}>
          {ticket.display_name}
        </p>
        {ticket.subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ticket.subtitle}</p>
        )}
        {ticket.buyer && (
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Pris par {buyerShortLabel(ticket.buyer.buyer_first_name, ticket.buyer.buyer_last_name, ticket.buyer.buyer_club)}
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
        "hover:-translate-y-0.5 hover:shadow-lg",
        selected && "ring-2",
        isBundle && "animate-glow"
      )}
      style={
        selected
          ? { backgroundColor: "var(--accent)", outline: "2px solid var(--primary)", outlineOffset: "-2px" }
          : isBundle
            ? { borderColor: "var(--secondary)", borderWidth: "2px" }
            : undefined
      }
    >
      {discounted && (
        <span
          className="absolute right-2 top-2 animate-sparkle rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ backgroundColor: "var(--secondary)", color: "var(--secondary-foreground)" }}
        >
          Promo
        </span>
      )}
      {isBundle && !discounted && (
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ backgroundColor: "var(--secondary)", color: "var(--secondary-foreground)" }}
        >
          ×5
        </span>
      )}
      {numberBadge && (
        <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
          {numberBadge}
        </span>
      )}
      <p className="font-display text-lg font-bold leading-tight" style={{ color: "var(--foreground)" }}>
        {ticket.display_name}
      </p>
      {ticket.subtitle && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ticket.subtitle}</p>
      )}
      {discounted && (
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Prix spécial : {formatEUR(Number(ticket.discount_price))}
        </p>
      )}
      <p
        className="mt-2 text-xs transition-colors"
        style={{ color: selected ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        {selected ? "✓ Dans le panier" : "Cliquer pour ajouter"}
      </p>
    </button>
  );
}
