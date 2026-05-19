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
  const [buyer, setBuyer] = useState({ firstName: "", lastName: "", club: "", phone: "" });
  const [step, setStep] = useState<"review" | "info">("review");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (selectedIds.length === 0) { router.replace("/"); return; }
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from("tickets").select("*").in("id", selectedIds);
      setTickets((data ?? []) as Ticket[]);
    })();
  }, [selectedIds, router]);

  const discountedCount = tickets.filter((t) => t.discount_price != null).length;
  const discountSum = tickets.filter((t) => t.discount_price != null).reduce((acc, t) => acc + Number(t.discount_price), 0);
  const adjustedTotal = discountedCount === 0 ? total : (() => {
    const reg = selectedIds.length - discountedCount;
    const f = Math.floor(reg / 5), r = reg % 5, th = Math.floor(r / 3), o = r % 3;
    return f * 7 + th * 5 + o * 2 + discountSum;
  })();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setConflicts([]);
    const phone = normalizeFrenchPhone(buyer.phone);
    if (!phone) { setError("Numéro de téléphone invalide."); return; }
    if (!buyer.firstName.trim() || !buyer.lastName.trim() || !buyer.club.trim()) { setError("Tous les champs sont obligatoires."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "tickets", ticketIds: selectedIds, buyer: { ...buyer, phone } }) });
      const data = await res.json();
      if (res.status === 409) { setConflicts(data.conflictingIds ?? []); setError("Certains tickets viennent d'être achetés par quelqu'un d'autre."); setSubmitting(false); return; }
      if (!res.ok) { setError(data?.error ?? "Erreur lors du paiement."); setSubmitting(false); return; }
      window.location.href = data.checkoutUrl;
    } catch { setError("Erreur réseau."); setSubmitting(false); }
  };

  if (selectedIds.length === 0) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-black">Finaliser ma commande</h1>

      {step === "review" && (
        <section className="mt-6 space-y-4">
          <div className="card p-5">
            <h2 className="font-bold">Mes tickets ({tickets.length})</h2>
            <ul className="mt-3 space-y-2">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--muted)" }}>
                  <div>
                    <span className="font-medium">{t.display_name}</span>
                    {t.ticket_number != null && <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>N°{t.ticket_number}</span>}
                    {t.subtitle && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {t.discount_price != null && (
                      <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "oklch(0.96 0.08 83)", color: "oklch(0.45 0.13 83)" }}>
                        {formatEUR(Number(t.discount_price))}
                      </span>
                    )}
                    <button type="button" onClick={() => removeTicket(t.id)} className="text-xs hover:underline" style={{ color: "var(--destructive)" }}>Retirer</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              {breakdown && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{breakdown}</p>}
              <p className="mt-1 text-2xl font-black" style={{ color: "var(--primary)" }}>Total : {formatEUR(adjustedTotal)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/")} className="btn-outline flex-1">← Modifier</button>
            <button onClick={() => setStep("info")} className="btn-primary flex-1">Continuer</button>
          </div>
        </section>
      )}

      {step === "info" && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Vos informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input mt-1" value={buyer.firstName} onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })} required /></div>
              <div><label className="label">Nom</label><input className="input mt-1" value={buyer.lastName} onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })} required /></div>
            </div>
            <div><label className="label">Club</label><input className="input mt-1" value={buyer.club} onChange={(e) => setBuyer({ ...buyer, club: e.target.value })} required /></div>
            <div><label className="label">Téléphone</label><input className="input mt-1" placeholder="06 12 34 56 78" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} required /></div>
          </div>
          {error && <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "oklch(0.97 0.05 27)", color: "var(--destructive)" }}>{error}</p>}
          {conflicts.length > 0 && (
            <p className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "oklch(0.96 0.08 83)", color: "oklch(0.45 0.13 83)" }}>
              Tickets non disponibles : {conflicts.length} —{" "}
              <button type="button" onClick={() => { conflicts.forEach(removeTicket); router.push("/"); }} className="underline">retirer et revenir</button>
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("review")} className="btn-outline flex-1">← Retour</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? "Redirection…" : `Payer ${formatEUR(adjustedTotal)}`}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
