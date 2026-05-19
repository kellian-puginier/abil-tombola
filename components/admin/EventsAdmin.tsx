"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpecialEvent } from "@/lib/types";

interface TicketOption {
  id: string;
  display_name: string;
}

export default function EventsAdmin({
  initialEvents,
  availableTickets
}: {
  initialEvents: SpecialEvent[];
  availableTickets: TicketOption[];
}) {
  const router = useRouter();
  const [type, setType] = useState<"discount" | "announcement">("announcement");
  const [label, setLabel] = useState("");
  const [ticketId, setTicketId] = useState<string>("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const body: any = { type, label };
    if (type === "discount") {
      if (!ticketId) {
        setError("Sélectionnez un ticket cible.");
        setSubmitting(false);
        return;
      }
      body.ticketId = ticketId;
      if (typeof discountPrice === "number") body.discountPrice = discountPrice;
    }
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur");
      setSubmitting(false);
      return;
    }
    setLabel("");
    setTicketId("");
    setDiscountPrice("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <main className="space-y-8">
      <h1 className="font-display text-3xl font-black">Événements spéciaux</h1>

      <form onSubmit={onSubmit} className="card space-y-3 p-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("announcement")}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium " +
              (type === "announcement"
                ? "bg-abil-green text-white"
                : "bg-slate-100 text-slate-600")
            }
          >
            Annonce
          </button>
          <button
            type="button"
            onClick={() => setType("discount")}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium " +
              (type === "discount"
                ? "bg-abil-gold text-abil-ink"
                : "bg-slate-100 text-slate-600")
            }
          >
            Réduction
          </button>
        </div>
        <input
          className="input"
          placeholder="Label affiché (ex. 🔥 Réduction spéciale ce soir !)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        {type === "discount" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="input"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              required
            >
              <option value="">— Choisir un ticket —</option>
              {availableTickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Prix réduit (€)"
              value={discountPrice}
              onChange={(e) =>
                setDiscountPrice(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={submitting} className="btn-primary">
          {submitting ? "…" : "Créer l'événement"}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-bold">Événements existants</h2>
        <ul className="space-y-2">
          {initialEvents.map((ev) => (
            <li key={ev.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{ev.label}</p>
                <p className="text-xs text-slate-500">{ev.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await fetch("/api/admin/events", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: ev.id,
                        isActive: !ev.is_active
                      })
                    });
                    router.refresh();
                  }}
                  className={
                    "rounded px-2 py-0.5 text-xs " +
                    (ev.is_active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600")
                  }
                >
                  {ev.is_active ? "actif" : "inactif"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Supprimer cet événement ?")) return;
                    await fetch(`/api/admin/events?id=${ev.id}`, {
                      method: "DELETE"
                    });
                    router.refresh();
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
