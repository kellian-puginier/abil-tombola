import type { Prize } from "@/lib/types";
import { formatEUR } from "@/lib/pricing";

export default function PrizesGallery({ prizes }: { prizes: Prize[] }) {
  if (prizes.length === 0) {
    return (
      <p className="rounded-xl px-4 py-8 text-center text-sm" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
        Les lots seront bientôt dévoilés.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {prizes.map((p) => (
        <article key={p.id} className="card overflow-hidden">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt={p.name} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-48 items-center justify-center text-5xl" style={{ backgroundColor: "var(--accent)" }}>
              🎁
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-2xl font-bold leading-tight">{p.name}</h3>
              {p.status === "drawn" && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "oklch(0.96 0.08 83)", color: "oklch(0.45 0.13 83)" }}>
                  🏆 Tiré
                </span>
              )}
            </div>
            {p.description && (
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>{p.description}</p>
            )}
            {p.estimated_value != null && (
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--primary)" }}>
                Valeur estimée : {formatEUR(Number(p.estimated_value))}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
