import { createSupabaseServiceClient } from "@/lib/supabase/server";
import TicketsAdmin from "@/components/admin/TicketsAdmin";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const supabase = createSupabaseServiceClient();
  const [{ data: tickets }, { data: bundles }] = await Promise.all([
    supabase
      .from("tickets")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("bundles")
      .select("*")
      .order("created_at", { ascending: false })
  ]);
  return (
    <TicketsAdmin
      initialTickets={tickets ?? []}
      initialBundles={bundles ?? []}
    />
  );
}
