import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Bundle, Prize, SpecialEvent, Ticket, TicketWithBuyer } from "@/lib/types";
import EventBanner from "@/components/public/EventBanner";
import PrizesGallery from "@/components/public/PrizesGallery";
import TicketGrid from "@/components/public/TicketGrid";
import CartBar from "@/components/public/CartBar";
import BundleCard from "@/components/public/BundleCard";

export const revalidate = 0;

async function loadData() {
  const supabase = createSupabaseServiceClient();
  const [{ data: tickets }, { data: bundles }, { data: prizes }, { data: events }, { data: winnerPurchases }] =
    await Promise.all([
      supabase.from("tickets").select("*").eq("is_active", true).order("ticket_number", { ascending: true, nullsFirst: false }).order("display_order", { ascending: true }),
      supabase.from("bundles").select("*").eq("is_active", true).eq("status", "available").order("created_at", { ascending: false }),
      supabase.from("prizes").select("*").order("display_order", { ascending: true }),
      supabase.from("special_events").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("purchases").select("id, buyer_first_name, buyer_last_name, buyer_club").eq("status", "completed")
    ]);

  const purchaseById = new Map<string, { buyer_first_name: string; buyer_last_name: string; buyer_club: string }>();
  for (const p of winnerPurchases ?? []) {
    purchaseById.set(p.id as string, { buyer_first_name: (p as any).buyer_first_name, buyer_last_name: (p as any).buyer_last_name, buyer_club: (p as any).buyer_club });
  }

  const ticketsWithBuyer: TicketWithBuyer[] = (tickets ?? []).map((t) => ({
    ...(t as Ticket),
    buyer: t.buyer_id ? purchaseById.get(t.buyer_id as string) ?? null : null
  }));

  return {
    tickets: ticketsWithBuyer,
    bundles: (bundles ?? []) as Bundle[],
    prizes: (prizes ?? []) as Prize[],
    events: (events ?? []) as SpecialEvent[]
  };
}

export default async function HomePage() {
  const { tickets, bundles, prizes, events } = await loadData();
  const announcement = events.find((e) => e.type === "announcement") ?? events[0];

  return (
    <main>
      {/* HERO */}
      <section className="bg-tombola-hero text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="mb-3 inline-block rounded-full px-4 py-1 text-sm font-medium tracking-wide" style={{ backgroundColor: "oklch(1 0 0 / 0.12)" }}>
            ABIL • Tour des Héraults
          </p>
          <h1 className="font-display text-4xl font-black leading-tight sm:text-6xl">
            La grande tombola du tournoi
          </h1>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl" style={{ color: "oklch(0.88 0.06 265)" }}>
            Chaque ticket porte le nom d&apos;un joueur. Champions de France, têtes de série régionales,
            et participants du tournoi : choisissez vos favoris et tentez votre chance pour des lots exceptionnels.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full px-4 py-2" style={{ backgroundColor: "oklch(1 0 0 / 0.12)" }}>🎫 1 ticket = 2 €</span>
            <span className="rounded-full px-4 py-2" style={{ backgroundColor: "oklch(1 0 0 / 0.12)" }}>🎁 Pack de 3 = 5 €</span>
            <span className="rounded-full px-4 py-2 font-semibold" style={{ backgroundColor: "var(--secondary)", color: "var(--secondary-foreground)" }}>
              ⭐ Pack de 5 = 7 €
            </span>
          </div>
        </div>
      </section>

      {announcement && <EventBanner event={announcement} />}

      {/* PRIZES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8">
          <h2 className="font-display text-3xl font-black sm:text-4xl">Les lots à gagner</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Chaque lot est tiré au sort indépendamment parmi tous les tickets vendus.
          </p>
        </header>
        <PrizesGallery prizes={prizes} />
      </section>

      {/* BUNDLES */}
      {bundles.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-4">
          <h2 className="mb-4 font-display text-2xl font-black">Tickets spéciaux ×5</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map((b) => <BundleCard key={b.id} bundle={b} />)}
          </div>
        </section>
      )}

      {/* TICKETS GRID */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-6">
          <h2 className="font-display text-3xl font-black sm:text-4xl">Choisissez vos tickets</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Chaque ticket porte le nom d&apos;un joueur unique. Cliquez pour l&apos;ajouter à votre panier.
          </p>
        </header>
        <TicketGrid initialTickets={tickets} />
      </section>

      <CartBar tickets={tickets} />
    </main>
  );
}
