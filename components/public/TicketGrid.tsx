"use client";

import { useEffect, useMemo, useState } from "react";
import TicketCard from "./TicketCard";
import type { Ticket, TicketWithBuyer } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Filter = "all" | "available" | "sold";

export default function TicketGrid({
  initialTickets
}: {
  initialTickets: TicketWithBuyer[];
}) {
  const [tickets, setTickets] = useState<TicketWithBuyer[]>(initialTickets);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("public:tickets")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        (payload) => {
          const updated = payload.new as Ticket;
          setTickets((prev) =>
            prev.map((t) =>
              t.id === updated.id ? { ...t, ...updated, buyer: t.buyer } : t
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => {
          const inserted = payload.new as Ticket;
          if (!inserted.is_active) return;
          setTickets((prev) => [...prev, { ...inserted, buyer: null }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "available")
      return tickets.filter((t) => t.status === "available");
    return tickets.filter((t) => t.status !== "available");
  }, [tickets, filter]);

  // Hide bundle sub-tickets from the regular grid: bundles are shown
  // as a single BundleCard purchased through their own flow.
  const visible = filtered.filter((t) => !t.is_bundle_member);

  const counts = useMemo(() => {
    return {
      all: tickets.filter((t) => !t.is_bundle_member).length,
      available: tickets.filter(
        (t) => !t.is_bundle_member && t.status === "available"
      ).length,
      sold: tickets.filter(
        (t) => !t.is_bundle_member && t.status !== "available"
      ).length
    };
  }, [tickets]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Tous (${counts.all})`}
        />
        <FilterPill
          active={filter === "available"}
          onClick={() => setFilter("available")}
          label={`Disponibles (${counts.available})`}
        />
        <FilterPill
          active={filter === "sold"}
          onClick={() => setFilter("sold")}
          label={`Vendus (${counts.sold})`}
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl bg-slate-100 px-4 py-8 text-center text-slate-500">
          Aucun ticket à afficher.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-4 py-2 text-sm font-medium transition " +
        (active
          ? "bg-abil-green text-white"
          : "bg-white text-slate-600 hover:bg-emerald-50")
      }
    >
      {label}
    </button>
  );
}
