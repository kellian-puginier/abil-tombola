"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatEUR } from "@/lib/pricing";
import { normalizeFrenchPhone } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const selectedIds = useCartStore((s) => s.selectedTicketIds);
  const total = useCartStore((s) => s.optimalPrice);
  const breakdown = useCartStore((s) => s.priceBreakdown);
  const removeTicket = useCartStore((s) => s.removeTicket);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [buyer, setBuyer] = useState({
    firstName: "",
    lastName: "",
    club: "",
    phone: ""
  });
  const [step, setStep] = useState<"review" | "info">("review");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      router.replace("/");
      return;
    }
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .in("id", selectedIds);
      setTickets((data ?? []) as Ticket[]);
    })();
  }, [selectedIds, router]);

  const discountSum = useMemo(
    () =>
      tickets
        .filter((t) => t.discount_price != null)
        .reduce((acc, t) => acc + Number(t.discount_price), 0),
    [tickets]
  );
  const discountedCount = tickets.filter((t) => t.discount_price != null).length;
  const adjustedTotal =
    discountedCount === 0
      ? total
      : (() => {
          const reg = selectedIds.length - discountedCount;
          const fives = Math.floor(reg / 5);
          const rem = reg % 5;
          const threes = Math.floor(rem / 3);
          const ones = rem % 3;
          return fives * 7 + threes * 5 + ones * 2 + discountSum;
        })();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflicts([]);

    const phone = normalizeFrenchPhone(buyer.phone);
    if (!phone) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    if (!buyer.firstName.trim() || !buyer.lastName.trim() || !buyer.club.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tickets",
          ticketIds: selectedIds,
          buyer: { ...buyer, phone }
        })
      });
      const data = await res.json();
      if (res.status === 409) {
        setConflicts(data.conflictingIds ?? []);
        setError(
          "Certains tickets viennent d'être achetés par quelqu'un d'autre."
        );
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "Erreur lors du paiement.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-black">Finaliser ma commande</h1>

      {step === "review" && (
        <section className="mt-6 space-y-4">
          <div className="card p-5">
            <h2 className="font-bold">Mes tickets ({tickets.length})</h2>
            <ul className="mt-3 space-y-2">
              {tickets.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium">{t.display_name}</span>
                  <div className="flex items-center gap-3">
                    {t.discount_price != null && (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {formatEUR(Number(t.discount_price))}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTicket(t.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-200 pt-4">
              {breakdown && (
                <p className="text-sm text-slate-600">{breakdown}</p>
              )}
              <p className="mt-1 text-2xl font-black text-abil-green">
                Total&nbsp;: {formatEUR(adjustedTotal)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push("/")}
              className="btn-secondary flex-1"
            >
              ← Modifier
            </button>
            <button
              onClick={() => setStep("info")}
              className="btn-primary flex-1"
            >
              Continuer
            </button>
          </div>
        </section>
      )}

      {step === "info" && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Vos informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input
                  className="input mt-1"
                  value={buyer.firstName}
                  onChange={(e) =>
                    setBuyer({ ...buyer, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Nom</label>
                <input
                  className="input mt-1"
                  value={buyer.lastName}
                  onChange={(e) =>
                    setBuyer({ ...buyer, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Club</label>
              <input
                className="input mt-1"
                value={buyer.club}
                onChange={(e) => setBuyer({ ...buyer, club: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                className="input mt-1"
                placeholder="06 12 34 56 78"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {conflicts.length > 0 && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tickets non disponibles&nbsp;: {conflicts.length} —&nbsp;
              <button
                type="button"
                onClick={() => {
                  conflicts.forEach(removeTicket);
                  router.push("/");
                }}
                className="underline"
              >
                retirer et revenir
              </button>
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("review")}
              className="btn-secondary flex-1"
            >
              ← Retour
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? "Redirection…" : `Payer ${formatEUR(adjustedTotal)}`}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
