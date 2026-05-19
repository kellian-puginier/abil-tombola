import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { type, label, ticketId, discountPrice } = body;
  if (
    (type !== "discount" && type !== "announcement") ||
    typeof label !== "string" ||
    !label.trim()
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (type === "discount" && typeof ticketId !== "string") {
    return NextResponse.json({ error: "missing_ticket" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  if (type === "discount" && typeof discountPrice === "number") {
    await supabase
      .from("tickets")
      .update({ discount_price: discountPrice })
      .eq("id", ticketId);
  }

  const { data, error } = await supabase
    .from("special_events")
    .insert({
      type,
      label: label.trim(),
      ticket_id: type === "discount" ? ticketId : null
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string")
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const updates: Record<string, any> = {};
  if (typeof body.label === "string") updates.label = body.label.trim();
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;

  const { data, error } = await supabase
    .from("special_events")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  // Clear discount on linked ticket if any.
  const { data: ev } = await supabase
    .from("special_events")
    .select("ticket_id")
    .eq("id", id)
    .single();
  if (ev?.ticket_id) {
    await supabase
      .from("tickets")
      .update({ discount_price: null })
      .eq("id", ev.ticket_id);
  }
  const { error } = await supabase.from("special_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
