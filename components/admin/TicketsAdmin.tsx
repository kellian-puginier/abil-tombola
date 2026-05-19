"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bundle, Ticket } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";

export default function TicketsAdmin({
  initialTickets,
  initialBundles
}: {
  initialTickets: Ticket[];
  initialBundles: Bundle[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "bulk" | "bundle">("single");

  return (
    <main className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-black">Tickets</h1>
      </header>

      <div className="card p-5">
        <div className="mb-4 flex gap-2">
          <TabBtn active={tab === "single"} onClick={() => setTab("single")}>
            Ajouter un ticket
          </TabBtn>
          <TabBtn active={tab === "bulk"} onClick={() => setTab("bulk")}>
            Import en masse
          </TabBtn>
          <TabBtn active={tab === "bundle"} onClick={() => setTab("bundle")}>
            Créer un bundle ×5
          </TabBtn>
        </div>
        {tab === "single" && <SingleForm onDone={() => router.refresh()} />}
        {tab === "bulk" && <BulkForm onDone={() => router.refresh()} />}
        {tab === "bundle" && <BundleForm onDone={() => router.refresh()} />}
      </div>

      {initialBundles.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">Bundles ×5</h2>
          <ul className="space-y-2">
            {initialBundles.map((b) => (
              <li key={b.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-bold">{b.player_name}</p>
                  <p className="text-xs text-slate-500">{b.special_label}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-abil-green">
                    {formatEUR(Number(b.special_price))}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs " +
                      (b.status === "sold"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600")
                    }
                  >
                    {b.status}
                  </span>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={async () => {
                      if (!confirm("Supprimer ce bundle et ses 5 tickets ?")) return;
                      await fetch(`/api/admin/bundles?id=${b.id}`, {
                        method: "DELETE"
                      });
                      router.refresh();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">Tickets ({initialTickets.length})</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-2">Ordre</th>
                <th className="px-4 py-2">Nom affiché</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Prix spécial</th>
                <th className="px-4 py-2">Bundle</th>
                <th className="px-4 py-2">Actif</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {initialTickets.map((t) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="px-4 py-2">{t.display_order}</td>
                  <td className="px-4 py-2 font-medium">{t.display_name}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-2">
                    {t.discount_price != null
                      ? formatEUR(Number(t.discount_price))
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {t.is_bundle_member ? `×5 (#${t.bundle_index})` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={async () => {
                        await fetch("/api/admin/tickets", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: t.id,
                            isActive: !t.is_active
                          })
                        });
                        router.refresh();
                      }}
                      className={
                        "rounded px-2 py-0.5 text-xs " +
                        (t.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600")
                      }
                    >
                      {t.is_active ? "Oui" : "Non"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={async () => {
                        if (!confirm("Supprimer ce ticket ?")) return;
                        await fetch(`/api/admin/tickets?id=${t.id}`, {
                          method: "DELETE"
                        });
                        router.refresh();
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
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

function TabBtn({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
        (active
          ? "bg-abil-green text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200")
      }
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "bg-slate-100 text-slate-700",
    sold: "bg-emerald-100 text-emerald-800",
    won: "bg-amber-100 text-amber-800"
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

function SingleForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await fetch("/api/admin/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: name, displayOrder: order })
        });
        setName("");
        setSubmitting(false);
        onDone();
      }}
    >
      <input
        className="input sm:col-span-2"
        placeholder="Nom du joueur"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="input"
        type="number"
        placeholder="Ordre"
        value={order}
        onChange={(e) => setOrder(Number(e.target.value))}
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary sm:col-span-3"
      >
        {submitting ? "…" : "Ajouter"}
      </button>
    </form>
  );
}

function BulkForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const names = text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (names.length === 0) return;
        setSubmitting(true);
        await fetch("/api/admin/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names })
        });
        setText("");
        setSubmitting(false);
        onDone();
      }}
      className="space-y-3"
    >
      <textarea
        className="input min-h-[160px]"
        placeholder="Un nom par ligne…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button disabled={submitting} className="btn-primary">
        {submitting ? "…" : "Importer"}
      </button>
    </form>
  );
}

function BundleForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await fetch("/api/admin/bundles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: name,
            specialLabel: label,
            specialPrice: price
          })
        });
        setName("");
        setLabel("");
        setPrice(8);
        setSubmitting(false);
        onDone();
      }}
      className="space-y-3"
    >
      <input
        className="input"
        placeholder="Nom du joueur (ex. Nicolas Vayer)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="Label spécial (ex. ⚡ Le champion local — 5 chances !)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
      />
      <input
        className="input"
        type="number"
        step="0.01"
        placeholder="Prix spécial"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        required
      />
      <button disabled={submitting} className="btn-gold">
        {submitting ? "…" : "Créer le bundle ×5"}
      </button>
    </form>
  );
}
