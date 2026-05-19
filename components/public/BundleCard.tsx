"use client";

import { useState } from "react";
import type { Bundle, BuyerInfo } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";
import { normalizeFrenchPhone } from "@/lib/utils";

export default function BundleCard({ bundle }: { bundle: Bundle }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card group relative overflow-hidden p-5 text-left ring-2 ring-abil-gold transition animate-glow hover:-translate-y-0.5"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-abil-gold px-2 py-0.5 text-[10px] font-bold uppercase text-abil-ink">
            ×5 chances
          </span>
          <span className="text-2xl">⚡</span>
        </div>
        <p className="mt-3 font-display text-2xl font-bold leading-tight">
          {bundle.player_name}
        </p>
        <p className="mt-2 text-sm text-amber-800">{bundle.special_label}</p>
        <p className="mt-4 text-2xl font-black text-abil-green">
          {formatEUR(Number(bundle.special_price))}
        </p>
      </button>

      {open && (
        <BundleModal bundle={bundle} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function BundleModal({ bundle, onClose }: { bundle: Bundle; onClose: () => void }) {
  const [buyer, setBuyer] = useState<BuyerInfo>({
    firstName: "",
    lastName: "",
    club: "",
    phone: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
          mode: "bundle",
          bundleId: bundle.id,
          buyer: { ...buyer, phone }
        })
      });
      const data = await res.json();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold">{bundle.player_name}</h2>
        <p className="mt-1 text-sm text-amber-700">{bundle.special_label}</p>
        <p className="mt-3 text-3xl font-black text-abil-green">
          {formatEUR(Number(bundle.special_price))}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Vous recevez 5 tickets — 5 chances pour chaque lot du tirage.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Prénom"
              value={buyer.firstName}
              onChange={(e) => setBuyer({ ...buyer, firstName: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Nom"
              value={buyer.lastName}
              onChange={(e) => setBuyer({ ...buyer, lastName: e.target.value })}
              required
            />
          </div>
          <input
            className="input"
            placeholder="Club"
            value={buyer.club}
            onChange={(e) => setBuyer({ ...buyer, club: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Téléphone (ex. 06 12 34 56 78)"
            value={buyer.phone}
            onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold flex-1"
            >
              {submitting ? "Redirection…" : "Payer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
