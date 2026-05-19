import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: list eligible tickets for the next draw (sold but not won yet).
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("id, display_name, buyer_id")
    .eq("status", "sold");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ eligible: data ?? [] });
}

// POST: confirm a draw. body: { prizeId, ticketId }
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.prizeId !== "string" || typeof body.ticketId !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: ticket, error: tErr } = await supabase
    .from("tickets")
    .select("id, status, buyer_id")
    .eq("id", body.ticketId)
    .single();
  if (tErr || !ticket || ticket.status !== "sold") {
    return NextResponse.json(
      { error: "ticket_not_eligible" },
      { status: 400 }
    );
  }

  const { data: prize, error: pErr } = await supabase
    .from("prizes")
    .select("id, status")
    .eq("id", body.prizeId)
    .single();
  if (pErr || !prize || prize.status !== "pending") {
    return NextResponse.json({ error: "prize_already_drawn" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: prizeUpdate } = await supabase
    .from("prizes")
    .update({
      status: "drawn",
      winner_ticket_id: ticket.id,
      winner_purchase_id: ticket.buyer_id,
      drawn_at: now
    })
    .eq("id", prize.id);
  if (prizeUpdate)
    return NextResponse.json({ error: prizeUpdate.message }, { status: 500 });

  const { error: ticketUpdate } = await supabase
    .from("tickets")
    .update({ status: "won" })
    .eq("id", ticket.id);
  if (ticketUpdate)
    return NextResponse.json({ error: ticketUpdate.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
