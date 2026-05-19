import { createSupabaseServiceClient } from "@/lib/supabase/server";
import PrizesAdmin from "@/components/admin/PrizesAdmin";

export const dynamic = "force-dynamic";

export default async function PrizesPage() {
  const supabase = createSupabaseServiceClient();
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .order("display_order", { ascending: true });
  return <PrizesAdmin initialPrizes={prizes ?? []} />;
}
