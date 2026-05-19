import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const estimatedValueRaw = form.get("estimatedValue");
  const displayOrderRaw = form.get("displayOrder");
  const image = form.get("image") as File | null;

  if (!name) return NextResponse.json({ error: "invalid_name" }, { status: 400 });

  const estimatedValue =
    typeof estimatedValueRaw === "string" && estimatedValueRaw.trim()
      ? Number(estimatedValueRaw)
      : null;
  const displayOrder =
    typeof displayOrderRaw === "string" && displayOrderRaw.trim()
      ? Number(displayOrderRaw)
      : 0;

  const supabase = createSupabaseServiceClient();

  let imageUrl: string | null = null;
  if (image && image.size > 0) {
    const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const arrayBuffer = await image.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("prize-images")
      .upload(filename, arrayBuffer, {
        contentType: image.type || "image/jpeg",
        upsert: false
      });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const { data: pub } = supabase.storage
      .from("prize-images")
      .getPublicUrl(filename);
    imageUrl = pub.publicUrl;
  }

  const { data, error } = await supabase
    .from("prizes")
    .insert({
      name,
      description,
      estimated_value: estimatedValue,
      display_order: displayOrder,
      image_url: imageUrl
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prize: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string")
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const updates: Record<string, any> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if ("description" in body) updates.description = body.description ?? null;
  if ("estimatedValue" in body)
    updates.estimated_value = body.estimatedValue ?? null;
  if (typeof body.displayOrder === "number")
    updates.display_order = body.displayOrder;
  if ("imageUrl" in body) updates.image_url = body.imageUrl ?? null;

  const { data, error } = await supabase
    .from("prizes")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prize: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("prizes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
