import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServiceClient();
  const [{ count: total }, { count: available }, { count: sold }, { count: won }, { data: completed }, { data: prizes }, { data: recent }] =
    await Promise.all([
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("is_active", true).eq("status", "available"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "sold"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "won"),
      supabase.from("purchases").select("id, total_amount, buyer_first_name, buyer_last_name, buyer_club").eq("status", "completed"),
      supabase.from("prizes").select("id, status"),
      supabase.from("purchases").select("*").eq("status", "completed").order("completed_at", { ascending: false }).limit(10)
    ]);

  const revenue = (completed ?? []).reduce((acc, p: any) => acc + Number(p.total_amount), 0);
  const buyers = new Set((completed ?? []).map((p: any) => `${p.buyer_first_name}|${p.buyer_last_name}|${p.buyer_club}`)).size;
  const drawn = (prizes ?? []).filter((p: any) => p.status === "drawn").length;

  return (
    <main className="space-y-8">
      <h1 className="font-display text-3xl font-black">Dashboard</h1>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tickets actifs" value={total ?? 0} />
        <Stat label="Disponibles" value={available ?? 0} />
        <Stat label="Vendus" value={(sold ?? 0) + (won ?? 0)} />
        <Stat label="Gagnés" value={won ?? 0} />
        <Stat label="Revenu total" value={formatEUR(revenue)} accent />
        <Stat label="Acheteurs" value={buyers} />
        <Stat label="Lots tirés" value={drawn} />
        <Stat label="Lots restants" value={(prizes ?? []).length - drawn} />
      </section>

      <section className="card overflow-hidden">
        <header className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold">Derniers achats</h2>
        </header>
        <ul>
          {(recent ?? []).length === 0 ? (
            <li className="px-5 py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Aucun achat pour le moment.</li>
          ) : (
            (recent ?? []).map((p: any) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div>
                  <p className="font-medium">{p.buyer_first_name} {p.buyer_last_name}
                    <span style={{ color: "var(--muted-foreground)" }}> — {p.buyer_club}</span>
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {p.ticket_ids?.length ?? 0} ticket(s) • {new Date(p.completed_at ?? p.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <p className="font-semibold" style={{ color: "var(--primary)" }}>{formatEUR(Number(p.total_amount))}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className="mt-1 text-3xl font-black" style={{ color: accent ? "var(--primary)" : "var(--foreground)" }}>{value}</p>
    </div>
  );
}
