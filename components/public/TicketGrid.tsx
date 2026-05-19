"use client";

import { useEffect, useMemo, useState } from "react";
import TicketCard from "./TicketCard";
import type { Ticket, TicketWithBuyer } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Filter = "all" | "available" | "sold";

export default function TicketGrid({ initialTickets }: { initialTickets: TicketWithBuyer[] }) {
  const [tickets, setTickets] = useState<TicketWithBuyer[]>(initialTickets);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("public:tickets")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, (payload) => {
        const updated = payload.new as Ticket;
        setTickets((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, ...updated, buyer: t.buyer } : t))
        );
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tickets" }, (payload) => {
        const inserted = payload.new as Ticket;
        if (!inserted.is_active) return;
        setTickets((prev) => [...prev, { ...inserted, buyer: null }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = useMemo(() => {
    const base = tickets.filter((t) => !t.is_bundle_member);
    if (filter === "available") return base.filter((t) => t.status === "available");
    if (filter === "sold") return base.filter((t) => t.status !== "available");
    return base;
  }, [tickets, filter]);

  const counts = useMemo(() => ({
    all: tickets.filter((t) => !t.is_bundle_member).length,
    available: tickets.filter((t) => !t.is_bundle_member && t.status === "available").length,
    sold: tickets.filter((t) => !t.is_bundle_member && t.status !== "available").length
  }), [tickets]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "available", "sold"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-2 text-sm font-medium transition"
            style={
              filter === f
                ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                : { backgroundColor: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
            }
          >
            {f === "all" ? `Tous (${counts.all})` : f === "available" ? `Disponibles (${counts.available})` : `Vendus (${counts.sold})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
          Aucun ticket à afficher.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );
}
