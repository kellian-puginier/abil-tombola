"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bundle, Ticket } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";

export default function TicketsAdmin({ initialTickets, initialBundles }: { initialTickets: Ticket[]; initialBundles: Bundle[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "bulk" | "bundle">("single");

  return (
    <main className="space-y-8">
      <h1 className="font-display text-3xl font-black">Tickets</h1>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["single", "bulk", "bundle"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              style={tab === t
                ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
              }
            >
              {t === "single" ? "Ajouter un ticket" : t === "bulk" ? "Import en masse" : "Créer un bundle ×5"}
            </button>
          ))}
        </div>
        {tab === "single" && <SingleForm onDone={() => router.refresh()} />}
        {tab === "bulk" && <BulkForm onDone={() => router.refresh()} />}
        {tab === "bundle" && <BundleForm onDone={() => router.refresh()} />}
      </div>

      {initialBundles.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">Bundles ×5 ({initialBundles.length})</h2>
          <ul className="space-y-2">
            {initialBundles.map((b) => (
              <li key={b.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-bold">{b.player_name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{b.special_label}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold" style={{ color: "var(--primary)" }}>{formatEUR(Number(b.special_price))}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>{b.status}</span>
                  <button className="text-xs hover:underline" style={{ color: "var(--destructive)" }}
                    onClick={async () => {
                      if (!confirm("Supprimer ce bundle et ses 5 tickets ?")) return;
                      await fetch(`/api/admin/bundles?id=${b.id}`, { method: "DELETE" });
                      router.refresh();
                    }}
                  >Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">Tickets ({initialTickets.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "var(--muted)" }}>
              <tr className="text-left">
                {["N°", "Nom affiché", "Sous-titre", "Statut", "Prix spécial", "Bundle", "Actif", ""].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialTickets.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-2 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {t.ticket_number != null ? `N°${t.ticket_number}` : "—"}
                  </td>
                  <td className="px-4 py-2 font-medium">{t.display_name}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--muted-foreground)" }}>{t.subtitle ?? "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-2">{t.discount_price != null ? formatEUR(Number(t.discount_price)) : "—"}</td>
                  <td className="px-4 py-2 text-xs">{t.is_bundle_member ? `×5 (#${t.bundle_index})` : "—"}</td>
                  <td className="px-4 py-2">
                    <button onClick={async () => {
                      await fetch("/api/admin/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, isActive: !t.is_active }) });
                      router.refresh();
                    }}
                      className="rounded px-2 py-0.5 text-xs"
                      style={t.is_active
                        ? { backgroundColor: "oklch(0.92 0.08 145)", color: "oklch(0.35 0.12 145)" }
                        : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
                      }
                    >
                      {t.is_active ? "Oui" : "Non"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-xs hover:underline" style={{ color: "var(--destructive)" }}
                      onClick={async () => {
                        if (!confirm("Supprimer ce ticket ?")) return;
                        await fetch(`/api/admin/tickets?id=${t.id}`, { method: "DELETE" });
                        router.refresh();
                      }}
                    >Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { backgroundColor: string; color: string }> = {
    available: { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" },
    sold: { backgroundColor: "oklch(0.92 0.08 145)", color: "oklch(0.35 0.12 145)" },
    won: { backgroundColor: "oklch(0.96 0.08 83)", color: "oklch(0.45 0.13 83)" }
  };
  return (
    <span className="rounded-full px-2 py-0.5 text-xs" style={styles[status] ?? {}}>
      {status}
    </span>
  );
}

function SingleForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={async (e) => {
      e.preventDefault();
      setSubmitting(true);
      await fetch("/api/admin/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerName: name, subtitle: subtitle || null, displayOrder: order }) });
      setName(""); setSubtitle(""); setSubmitting(false); onDone();
    }}>
      <input className="input sm:col-span-2" placeholder="Nom du joueur (ex. Nicolas Vayer)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input sm:col-span-2" placeholder="Sous-titre : club, nationalité ou titre (optionnel)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      <input className="input" type="number" placeholder="Ordre d'affichage" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
      <button type="submit" disabled={submitting} className="btn-primary sm:col-span-2">
        {submitting ? "…" : "Ajouter"}
      </button>
    </form>
  );
}

function BulkForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      const names = text.split("\n").map((s) => s.trim()).filter(Boolean);
      if (names.length === 0) return;
      setSubmitting(true);
      await fetch("/api/admin/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names }) });
      setText(""); setSubmitting(false); onDone();
    }} className="space-y-3">
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Un nom par ligne. Les numéros de tickets sont assignés automatiquement à la suite des tickets existants.
      </p>
      <textarea className="input min-h-[160px]" placeholder={"Nicolas Vayer\nThomas Rouxel\nLéa Martin\n…"} value={text} onChange={(e) => setText(e.target.value)} />
      <button disabled={submitting} className="btn-primary">{submitting ? "…" : "Importer"}</button>
    </form>
  );
}

function BundleForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setSubmitting(true);
      await fetch("/api/admin/bundles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerName: name, specialLabel: label, specialPrice: price }) });
      setName(""); setLabel(""); setPrice(8); setSubmitting(false); onDone();
    }} className="space-y-3">
      <input className="input" placeholder="Nom du joueur (ex. Nicolas Vayer)" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input" placeholder="Label spécial (ex. ⚡ Le champion local — 5 chances !)" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <input className="input" type="number" step="0.01" placeholder="Prix spécial (€)" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
      <button disabled={submitting} className="btn-yellow">{submitting ? "…" : "Créer le bundle ×5"}</button>
    </form>
  );
}
