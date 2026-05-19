import { createSupabaseServiceClient } from "@/lib/supabase/server";
import DrawPanel from "@/components/admin/DrawPanel";

export const dynamic = "force-dynamic";

export default async function DrawPage() {
  const supabase = createSupabaseServiceClient();
  const [{ data: prizes }, { data: eligible }, { data: purchases }] =
    await Promise.all([
      supabase
        .from("prizes")
        .select("*")
        .order("display_order", { ascending: true }),
      supabase
        .from("tickets")
        .select("id, display_name, buyer_id")
        .eq("status", "sold"),
      supabase
        .from("purchases")
        .select("id, buyer_first_name, buyer_last_name, buyer_club")
        .eq("status", "completed")
    ]);
  return (
    <DrawPanel
      prizes={prizes ?? []}
      eligibleTickets={eligible ?? []}
      purchases={purchases ?? []}
    />
  );
}
