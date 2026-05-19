import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  getSumUpCheckout,
  verifySumUpWebhookSignature
} from "@/lib/sumup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-sumup-signature");

  if (!verifySumUpWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // SumUp event payloads carry { event_type, payload: { checkout_reference } }.
  const reference: string | undefined =
    event?.payload?.checkout_reference ?? event?.checkout_reference;
  const checkoutId: string | undefined =
    event?.payload?.id ?? event?.id ?? event?.payload?.checkout_id;

  const purchaseId = reference?.startsWith("ABIL-TOMBOLA-")
    ? reference.slice("ABIL-TOMBOLA-".length)
    : null;

  if (!purchaseId && !checkoutId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createSupabaseServiceClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .or(
      [
        purchaseId ? `id.eq.${purchaseId}` : null,
        checkoutId ? `sumup_checkout_id.eq.${checkoutId}` : null
      ]
        .filter(Boolean)
        .join(",")
    )
    .maybeSingle();

  if (!purchase) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  if (purchase.status === "completed") {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }
  if (!purchase.sumup_checkout_id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const checkout = await getSumUpCheckout(purchase.sumup_checkout_id);
  if (checkout.status !== "PAID") {
    if (checkout.status === "FAILED" || checkout.status === "EXPIRED") {
      await supabase
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", purchase.id);
    }
    return NextResponse.json({ ok: true, status: checkout.status });
  }

  const { data: firstTicket } = await supabase
    .from("tickets")
    .select("bundle_id")
    .eq("id", purchase.ticket_ids[0])
    .single();

  let claimed: boolean;
  if (firstTicket?.bundle_id) {
    const { data, error } = await supabase.rpc("claim_bundle", {
      p_bundle_id: firstTicket.bundle_id,
      p_purchase_id: purchase.id
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    claimed = data === true;
  } else {
    const { data, error } = await supabase.rpc("claim_tickets", {
      p_ticket_ids: purchase.ticket_ids,
      p_purchase_id: purchase.id
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    claimed = data === true;
  }

  if (!claimed) {
    return NextResponse.json({ ok: true, conflict: true });
  }

  await supabase
    .from("purchases")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", purchase.id);

  return NextResponse.json({ ok: true });
}
