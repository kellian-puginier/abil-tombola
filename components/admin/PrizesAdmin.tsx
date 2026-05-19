"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prize } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";

export default function PrizesAdmin({ initialPrizes }: { initialPrizes: Prize[] }) {
  const router = useRouter();
  return (
    <main className="space-y-8">
      <h1 className="font-display text-3xl font-black">Lots</h1>
      <PrizeForm onDone={() => router.refresh()} />
      <section>
        <h2 className="mb-3 font-bold">Lots existants ({initialPrizes.length})</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialPrizes.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center text-4xl" style={{ backgroundColor: "var(--accent)" }}>🎁</div>
              )}
              <div className="space-y-1 p-4">
                <p className="font-bold">{p.name}</p>
                {p.estimated_value != null && (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatEUR(Number(p.estimated_value))}</p>
                )}
                <p className="text-xs">
                  Statut : <span style={{ color: p.status === "drawn" ? "oklch(0.55 0.15 83)" : "var(--muted-foreground)" }}>{p.status}</span>
                </p>
                <div className="flex justify-between pt-2">
                  <button onClick={async () => {
                    const order = prompt("Nouvel ordre :", String(p.display_order));
                    if (order == null) return;
                    await fetch("/api/admin/prizes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, displayOrder: Number(order) }) });
                    router.refresh();
                  }} className="text-xs hover:underline" style={{ color: "var(--primary)" }}>Ordre</button>
                  <button onClick={async () => {
                    if (!confirm("Supprimer ce lot ?")) return;
                    await fetch(`/api/admin/prizes?id=${p.id}`, { method: "DELETE" });
                    router.refresh();
                  }} className="text-xs hover:underline" style={{ color: "var(--destructive)" }}>Supprimer</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function PrizeForm({ onDone }: { onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const image = fd.get("image") as File | null;
    if (image && image.size > 0 && image.type.startsWith("image/")) {
      try {
        const compressed = await compressImage(image);
        fd.set("image", compressed, compressed.name);
      } catch { /* fall back to original */ }
    }

    const res = await fetch("/api/admin/prizes", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur");
      setSubmitting(false);
      return;
    }
    formRef.current?.reset();
    setSubmitting(false);
    onDone();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card space-y-3 p-5" encType="multipart/form-data">
      <h2 className="font-bold">Ajouter un lot</h2>
      <input className="input" name="name" placeholder="Nom du lot (ex. Raquette Yonex, Lot de bières…)" required />
      <textarea className="input" name="description" placeholder="Description (optionnel)" />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="input" name="estimatedValue" type="number" step="0.01" placeholder="Valeur estimée (€)" />
        <input className="input" name="displayOrder" type="number" placeholder="Ordre d'affichage" />
        <div>
          <label className="label">Quantité</label>
          <input
            className="input mt-1"
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            placeholder="1"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Crée N tirages indépendants pour le même lot
          </p>
        </div>
      </div>
      <input className="input" name="image" type="file" accept="image/*" />
      {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
      <button disabled={submitting} className="btn-primary">
        {submitting ? "Envoi…" : "Créer le lot"}
      </button>
    </form>
  );
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxW = 800;
  const ratio = bitmap.width > maxW ? maxW / bitmap.width : 1;
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
