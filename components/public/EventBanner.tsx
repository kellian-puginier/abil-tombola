import type { SpecialEvent } from "@/lib/types";

export default function EventBanner({ event }: { event: SpecialEvent }) {
  return (
    <div className="border-y border-yellow-300 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <span className="animate-sparkle text-2xl">✨</span>
        <p className="font-semibold text-amber-900">{event.label}</p>
      </div>
    </div>
  );
}
