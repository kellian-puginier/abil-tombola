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

  const { playerName, specialLabel, specialPrice } = body;
  if (
    typeof playerName !== "string" ||
    !playerName.trim() ||
    typeof specialLabel !== "string" ||
    !specialLabel.trim() ||
    typeof specialPrice !== "number" ||
    !Number.isFinite(specialPrice) ||
    specialPrice <= 0
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: bundle, error: bundleErr } = await supabase
    .from("bundles")
    .insert({
      player_name: playerName.trim(),
      special_label: specialLabel.trim(),
      special_price: specialPrice
    })
    .select()
    .single();
  if (bundleErr || !bundle) {
    return NextResponse.json({ error: bundleErr?.message ?? "insert_failed" }, { status: 500 });
  }

  const subTickets = Array.from({ length: 5 }, (_, i) => ({
    player_name: playerName.trim(),
    display_name: `${playerName.trim()}-${i + 1}`,
    is_bundle_member: true,
    bundle_id: bundle.id,
    bundle_index: i + 1
  }));
  const { error: ticketsErr } = await supabase.from("tickets").insert(subTickets);
  if (ticketsErr) {
    await supabase.from("bundles").delete().eq("id", bundle.id);
    return NextResponse.json({ error: ticketsErr.message }, { status: 500 });
  }

  return NextResponse.json({ bundle });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string")
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const updates: Record<string, any> = {};
  if (typeof body.specialLabel === "string")
    updates.special_label = body.specialLabel.trim();
  if (typeof body.specialPrice === "number")
    updates.special_price = body.specialPrice;
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;

  const { data, error } = await supabase
    .from("bundles")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bundle: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  // Remove sub-tickets first to avoid orphans.
  await supabase.from("tickets").delete().eq("bundle_id", id);
  const { error } = await supabase.from("bundles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
