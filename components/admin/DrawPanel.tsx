"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prize } from "@/lib/types";

interface EligibleTicket { id: string; display_name: string; buyer_id: string | null; }
interface BuyerRef { id: string; buyer_first_name: string; buyer_last_name: string; buyer_club: string; }
type Phase = "idle" | "spinning" | "landed";

export default function DrawPanel({ prizes, eligibleTickets, purchases }: { prizes: Prize[]; eligibleTickets: EligibleTicket[]; purchases: BuyerRef[]; }) {
  const router = useRouter();
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayName, setDisplayName] = useState<string>("");
  const [winner, setWinner] = useState<EligibleTicket | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const buyerById = useMemo(() => {
    const m = new Map<string, BuyerRef>();
    for (const p of purchases) m.set(p.id, p);
    return m;
  }, [purchases]);

  const eligible = useMemo(() => eligibleTickets.filter((t) => !!t.buyer_id), [eligibleTickets]);

  useEffect(() => () => { timeoutRefs.current.forEach(clearTimeout); }, []);

  function startDraw() {
    if (!selectedPrize || eligible.length === 0) return;
    setPhase("spinning");
    setWinner(null);
    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    const ticks = [60, 80, 100, 130, 170, 220, 280, 350, 450, 600, 800];
    let i = 0;
    const cycle = () => {
      setDisplayName(eligible[Math.floor(Math.random() * eligible.length)].display_name);
      if (i >= ticks.length) { setDisplayName(picked.display_name); setWinner(picked); setPhase("landed"); return; }
      const t = setTimeout(cycle, ticks[i]);
      timeoutRefs.current.push(t);
      i++;
    };
    cycle();
  }

  async function confirm() {
    if (!selectedPrize || !winner) return;
    setConfirming(true);
    const res = await fetch("/api/admin/draw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prizeId: selectedPrize.id, ticketId: winner.id }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert("Erreur : " + (d.error ?? res.status)); setConfirming(false); return; }
    setConfirming(false); setSelectedPrize(null); setWinner(null); setPhase("idle"); setDisplayName("");
    router.refresh();
  }

  const buyer = winner?.buyer_id ? buyerById.get(winner.buyer_id) : null;

  return (
    <main>
      <h1 className="mb-6 font-display text-3xl font-black">Tirage au sort</h1>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <h2 className="mb-3 font-bold text-sm uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Lots</h2>
          <ul className="space-y-2">
            {prizes.map((p) => {
              const isActive = selectedPrize?.id === p.id;
              const isDone = p.status === "drawn";
              return (
                <li key={p.id}>
                  <button onClick={() => { if (isDone) return; setSelectedPrize(p); setPhase("idle"); setWinner(null); setDisplayName(""); }}
                    disabled={isDone}
                    className="w-full rounded-xl p-3 text-left transition"
                    style={isActive
                      ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                      : isDone
                        ? { backgroundColor: "oklch(0.96 0.08 83)", color: "oklch(0.45 0.13 83)" }
                        : { backgroundColor: "var(--card)", border: "1px solid var(--border)" }
                    }
                  >
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs opacity-75">{isDone ? "🏆 Déjà tiré" : "à tirer"}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="card flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
          {!selectedPrize ? (
            <p style={{ color: "var(--muted-foreground)" }}>Sélectionnez un lot dans la liste pour lancer le tirage.</p>
          ) : (
            <>
              <p className="label">Lot en jeu</p>
              <h2 className="mt-1 font-display text-3xl font-black">{selectedPrize.name}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                {eligible.length} ticket{eligible.length > 1 ? "s" : ""} éligible{eligible.length > 1 ? "s" : ""}
              </p>

              <div className="my-10 min-h-[120px] w-full max-w-xl">
                {phase === "idle" && (
                  <p className="text-2xl" style={{ color: "var(--muted-foreground)" }}>Prêt à tirer…</p>
                )}
                {phase !== "idle" && (
                  <div className={`rounded-2xl px-6 py-8 ${phase === "spinning" ? "animate-pulse" : ""}`} style={{ backgroundColor: "var(--accent)" }}>
                    <p className="font-display text-5xl font-black" style={{ color: "var(--primary)" }}>
                      {displayName || "…"}
                    </p>
                    {phase === "landed" && buyer && (
                      <p className="mt-3 text-lg" style={{ color: "oklch(0.55 0.15 83)" }}>
                        🏆 {buyer.buyer_first_name} {buyer.buyer_last_name}
                        <span style={{ color: "var(--muted-foreground)" }}> — {buyer.buyer_club}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={startDraw} disabled={eligible.length === 0 || phase === "spinning"} className="btn-primary">
                  {phase === "landed" ? "Retirer au sort" : "Tirer au sort"}
                </button>
                {phase === "landed" && (
                  <button onClick={confirm} disabled={confirming} className="btn-yellow">
                    {confirming ? "…" : "Confirmer ce tirage"}
                  </button>
                )}
              </div>

              {eligible.length === 0 && (
                <p className="mt-6 text-sm" style={{ color: "var(--destructive)" }}>
                  Plus aucun ticket éligible — tous les tickets vendus ont déjà gagné un lot.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
