import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function nextTicketNumber(
  supabase: ReturnType<typeof createSupabaseServiceClient>
): Promise<number> {
  const { data } = await supabase
    .from("tickets")
    .select("ticket_number")
    .order("ticket_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.ticket_number ?? 0) + 1;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = createSupabaseServiceClient();

  // Bulk: { names: ["a","b",...], startOrder?: number }
  if (Array.isArray(body.names)) {
    const start = Number.isFinite(body.startOrder) ? Number(body.startOrder) : 0;
    const names: string[] = body.names
      .filter((n: any) => typeof n === "string" && n.trim().length > 0)
      .map((n: string) => n.trim());
    if (names.length === 0)
      return NextResponse.json({ error: "no_names" }, { status: 400 });

    const firstNumber = await nextTicketNumber(supabase);
    const rows = names.map((name, i) => ({
      player_name: name,
      display_name: name,
      display_order: start + i,
      ticket_number: firstNumber + i
    }));
    const { data, error } = await supabase.from("tickets").insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tickets: data });
  }

  // Single ticket
  const { playerName, displayOrder, discountPrice, subtitle, ticketNumber } = body;
  if (typeof playerName !== "string" || !playerName.trim()) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const number =
    typeof ticketNumber === "number" && Number.isFinite(ticketNumber)
      ? ticketNumber
      : await nextTicketNumber(supabase);

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      player_name: playerName.trim(),
      display_name: playerName.trim(),
      display_order:
        typeof displayOrder === "number" && Number.isFinite(displayOrder)
          ? displayOrder
          : 0,
      discount_price:
        typeof discountPrice === "number" && Number.isFinite(discountPrice)
          ? discountPrice
          : null,
      subtitle: typeof subtitle === "string" && subtitle.trim() ? subtitle.trim() : null,
      ticket_number: number
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string")
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const updates: Record<string, any> = {};
  if (typeof body.displayName === "string") updates.display_name = body.displayName.trim();
  if (typeof body.playerName === "string") updates.player_name = body.playerName.trim();
  if (typeof body.displayOrder === "number") updates.display_order = body.displayOrder;
  if (body.discountPrice === null || typeof body.discountPrice === "number")
    updates.discount_price = body.discountPrice;
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;
  if ("subtitle" in body)
    updates.subtitle =
      typeof body.subtitle === "string" && body.subtitle.trim()
        ? body.subtitle.trim()
        : null;
  if (typeof body.ticketNumber === "number") updates.ticket_number = body.ticketNumber;

  const { data, error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
