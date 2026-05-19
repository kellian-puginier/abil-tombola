import { createSupabaseServiceClient } from "@/lib/supabase/server";
import EventsAdmin from "@/components/admin/EventsAdmin";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createSupabaseServiceClient();
  const [{ data: events }, { data: tickets }] = await Promise.all([
    supabase
      .from("special_events")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("tickets")
      .select("id, display_name, status, is_active")
      .eq("status", "available")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
  ]);
  return (
    <EventsAdmin
      initialEvents={events ?? []}
      availableTickets={tickets ?? []}
    />
  );
}
