"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

interface VerifyResponse {
  success: boolean;
  status?: "pending" | "completed" | "failed";
  buyerName?: string;
  ticketNames?: string[];
  error?: string;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl px-4 py-16 text-center">Chargement…</main>}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const router = useRouter();
  const search = useSearchParams();
  const purchaseId = search.get("purchase_id");
  const clearCart = useCartStore((s) => s.clearCart);
  const clearBundle = useCartStore((s) => s.clearBundle);
  const [state, setState] = useState<"verifying" | "ok" | "pending" | "failed">("verifying");
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!purchaseId) { router.replace("/"); return; }
    let attempts = 0;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        const res = await fetch(`/api/verify-checkout?purchase_id=${encodeURIComponent(purchaseId)}`, { cache: "no-store" });
        const data = (await res.json()) as VerifyResponse;
        setResult(data);
        if (data.success) { clearCart(); clearBundle(); setState("ok"); return; }
        if (data.status === "failed") { setState("failed"); return; }
        if (attempts >= 10) { setState("pending"); return; }
        setTimeout(tick, 2000);
      } catch {
        if (attempts >= 10) { setState("pending"); return; }
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [purchaseId, router, clearCart, clearBundle]);

  return (
    <main className="relative mx-auto min-h-screen max-w-2xl px-4 py-16">
      {state === "ok" && <Confetti />}

      {state === "verifying" && (
        <div className="card p-8 text-center">
          <p className="text-5xl">⏳</p>
          <h1 className="mt-4 font-display text-2xl font-black">Vérification du paiement…</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>Quelques secondes — ne fermez pas cette page.</p>
        </div>
      )}

      {state === "ok" && result?.success && (
        <div className="card relative z-10 p-8 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="mt-4 font-display text-3xl font-black">Merci {result.buyerName} !</h1>
          <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>Votre paiement est confirmé. Voici vos tickets :</p>
          <ul className="mx-auto mt-4 inline-block text-left">
            {result.ticketNames?.map((n) => (
              <li key={n} className="py-1 font-semibold" style={{ color: "var(--primary)" }}>🎫 {n}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Le tirage aura lieu pendant le tournoi. Bonne chance !</p>
          <button onClick={() => router.push("/")} className="btn-primary mt-6">Retour à la tombola</button>
        </div>
      )}

      {state === "pending" && (
        <div className="card p-8 text-center">
          <p className="text-5xl">⏱️</p>
          <h1 className="mt-4 font-display text-2xl font-black">Paiement en attente</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Nous n&apos;avons pas encore reçu la confirmation. Si votre paiement a bien été débité, contactez l&apos;équipe ABIL avec votre référence :
          </p>
          <p className="mt-3 font-mono text-sm">{purchaseId}</p>
        </div>
      )}

      {state === "failed" && (
        <div className="card p-8 text-center">
          <p className="text-5xl">😕</p>
          <h1 className="mt-4 font-display text-2xl font-black">Paiement échoué</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>Aucun montant n&apos;a été débité. Vous pouvez réessayer.</p>
          <button onClick={() => router.push("/")} className="btn-primary mt-6">Retour</button>
        </div>
      )}
    </main>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute -top-4 inline-block h-3 w-3 animate-confetti rounded-sm"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            animationDelay: `${(i % 8) * 0.2}s`,
            backgroundColor: ["var(--primary)", "var(--secondary)", "oklch(0.70 0.18 265)", "#fff"][i % 4]
          }}
        />
      ))}
    </div>
  );
}
