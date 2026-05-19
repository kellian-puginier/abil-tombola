import type { SpecialEvent } from "@/lib/types";

export default function EventBanner({ event }: { event: SpecialEvent }) {
  return (
    <div style={{ borderTop: "1px solid var(--secondary)", borderBottom: "1px solid var(--secondary)", backgroundColor: "oklch(0.96 0.08 83)" }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <span className="animate-sparkle text-2xl">✨</span>
        <p className="font-semibold" style={{ color: "oklch(0.35 0.12 83)" }}>{event.label}</p>
      </div>
    </div>
  );
}
