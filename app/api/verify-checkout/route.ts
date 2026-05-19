import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getSumUpCheckout } from "@/lib/sumup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const purchaseId = req.nextUrl.searchParams.get("purchase_id");
  if (!purchaseId) {
    return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();
  if (error || !purchase) {
    return NextResponse.json({ success: false, error: "unknown_purchase" }, { status: 404 });
  }

  if (purchase.status === "completed") {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("display_name")
      .in("id", purchase.ticket_ids);
    return NextResponse.json({
      success: true,
      status: "completed",
      buyerName: purchase.buyer_first_name,
      ticketNames: (tickets ?? []).map((t: any) => t.display_name)
    });
  }
  if (purchase.status === "failed") {
    return NextResponse.json({ success: false, status: "failed" });
  }
  if (!purchase.sumup_checkout_id) {
    return NextResponse.json({ success: false, status: "pending" });
  }

  try {
    const checkout = await getSumUpCheckout(purchase.sumup_checkout_id);
    if (checkout.status === "PAID") {
      const claimed = await claimTickets(supabase, purchase);
      if (!claimed.ok) {
        return NextResponse.json({
          success: false,
          status: "pending",
          error: claimed.error
        });
      }
      await supabase
        .from("purchases")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", purchase.id);
      const { data: tickets } = await supabase
        .from("tickets")
        .select("display_name")
        .in("id", purchase.ticket_ids);
      return NextResponse.json({
        success: true,
        status: "completed",
        buyerName: purchase.buyer_first_name,
        ticketNames: (tickets ?? []).map((t: any) => t.display_name)
      });
    }
    if (checkout.status === "FAILED" || checkout.status === "EXPIRED") {
      await supabase
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", purchase.id);
      return NextResponse.json({ success: false, status: "failed" });
    }
    return NextResponse.json({ success: false, status: "pending" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: "pending", error: err?.message },
      { status: 200 }
    );
  }
}

async function claimTickets(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  purchase: any
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Check if the purchase is a bundle (the bundle row's UUID == any bundle_id
  // matching one of its tickets).
  const { data: firstTicket } = await supabase
    .from("tickets")
    .select("bundle_id")
    .eq("id", purchase.ticket_ids[0])
    .single();

  if (firstTicket?.bundle_id) {
    const { data, error } = await supabase.rpc("claim_bundle", {
      p_bundle_id: firstTicket.bundle_id,
      p_purchase_id: purchase.id
    });
    if (error) return { ok: false, error: error.message };
    if (data === false) return { ok: false, error: "bundle_already_sold" };
    return { ok: true };
  }

  const { data, error } = await supabase.rpc("claim_tickets", {
    p_ticket_ids: purchase.ticket_ids,
    p_purchase_id: purchase.id
  });
  if (error) return { ok: false, error: error.message };
  if (data === false) return { ok: false, error: "ticket_conflict" };
  return { ok: true };
}
