"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prize } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";

export default function PrizesAdmin({ initialPrizes }: { initialPrizes: Prize[] }) {
  const router = useRouter();
  return (
    <main className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-black">Lots</h1>
      </header>

      <PrizeForm onDone={() => router.refresh()} />

      <section>
        <h2 className="mb-3 font-bold">Lots existants ({initialPrizes.length})</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialPrizes.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-emerald-50 text-4xl">
                  🎁
                </div>
              )}
              <div className="space-y-1 p-4">
                <p className="font-bold">{p.name}</p>
                {p.estimated_value != null && (
                  <p className="text-sm text-slate-600">
                    {formatEUR(Number(p.estimated_value))}
                  </p>
                )}
                <p className="text-xs">
                  Statut&nbsp;:{" "}
                  <span
                    className={
                      p.status === "drawn"
                        ? "text-amber-700"
                        : "text-slate-500"
                    }
                  >
                    {p.status}
                  </span>
                </p>
                <div className="flex justify-between pt-2">
                  <button
                    onClick={async () => {
                      const order = prompt("Nouvel ordre :", String(p.display_order));
                      if (order == null) return;
                      await fetch("/api/admin/prizes", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: p.id,
                          displayOrder: Number(order)
                        })
                      });
                      router.refresh();
                    }}
                    className="text-xs text-abil-green hover:underline"
                  >
                    Ordre
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Supprimer ce lot ?")) return;
                      await fetch(`/api/admin/prizes?id=${p.id}`, {
                        method: "DELETE"
                      });
                      router.refresh();
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
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

    // Client-side image compression: max width 800px, JPEG q=0.8
    const image = fd.get("image") as File | null;
    if (image && image.size > 0 && image.type.startsWith("image/")) {
      try {
        const compressed = await compressImage(image);
        fd.set("image", compressed, compressed.name);
      } catch {
        // fall back to original
      }
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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="card space-y-3 p-5"
      encType="multipart/form-data"
    >
      <h2 className="font-bold">Ajouter un lot</h2>
      <input className="input" name="name" placeholder="Nom du lot" required />
      <textarea className="input" name="description" placeholder="Description" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="input"
          name="estimatedValue"
          type="number"
          step="0.01"
          placeholder="Valeur estimée (€)"
        />
        <input
          className="input"
          name="displayOrder"
          type="number"
          placeholder="Ordre d'affichage"
        />
      </div>
      <input className="input" name="image" type="file" accept="image/*" />
      {error && <p className="text-sm text-red-600">{error}</p>}
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
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
  );
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg"
  });
}
