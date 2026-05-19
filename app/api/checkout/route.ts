import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { createSumUpCheckout } from "@/lib/sumup";
import { computeOptimalPrice } from "@/lib/pricing";
import { normalizeFrenchPhone } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BuyerPayload {
  firstName: string;
  lastName: string;
  club: string;
  phone: string;
}

function validateBuyer(b: any): BuyerPayload | null {
  if (!b || typeof b !== "object") return null;
  const { firstName, lastName, club, phone } = b;
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof club !== "string" ||
    typeof phone !== "string"
  )
    return null;
  if (!firstName.trim() || !lastName.trim() || !club.trim()) return null;
  const normalized = normalizeFrenchPhone(phone);
  if (!normalized) return null;
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    club: club.trim(),
    phone: normalized
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const buyer = validateBuyer(body.buyer);
  if (!buyer) return NextResponse.json({ error: "invalid_buyer" }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (body.mode === "bundle") {
    return handleBundle(body.bundleId, buyer, supabase, appUrl);
  }
  return handleTickets(body.ticketIds, buyer, supabase, appUrl);
}

async function handleTickets(
  ticketIds: unknown,
  buyer: BuyerPayload,
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  appUrl: string
) {
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return NextResponse.json({ error: "no_tickets" }, { status: 400 });
  }
  const ids = ticketIds.filter((x): x is string => typeof x === "string");

  const { data: tickets, error: ticketErr } = await supabase
    .from("tickets")
    .select("id, status, discount_price, is_active, is_bundle_member")
    .in("id", ids);
  if (ticketErr) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  if (!tickets || tickets.length !== ids.length) {
    return NextResponse.json({ error: "unknown_tickets" }, { status: 400 });
  }
  const conflicting = tickets.filter(
    (t) => t.status !== "available" || !t.is_active || t.is_bundle_member
  );
  if (conflicting.length > 0) {
    return NextResponse.json(
      {
        error: "tickets_unavailable",
        conflictingIds: conflicting.map((t) => t.id)
      },
      { status: 409 }
    );
  }

  // Compute total: discounted tickets use their override, the rest use packs.
  const discounted = tickets.filter((t) => t.discount_price != null);
  const discountSum = discounted.reduce(
    (acc, t) => acc + Number(t.discount_price),
    0
  );
  const regularCount = tickets.length - discounted.length;
  const { total } = computeOptimalPrice(regularCount);
  const totalAmount = Math.round((total + discountSum) * 100) / 100;

  const { data: purchase, error: insertErr } = await supabase
    .from("purchases")
    .insert({
      buyer_first_name: buyer.firstName,
      buyer_last_name: buyer.lastName,
      buyer_club: buyer.club,
      buyer_phone: buyer.phone,
      ticket_ids: ids,
      total_amount: totalAmount,
      status: "pending"
    })
    .select()
    .single();
  if (insertErr || !purchase) {
    return NextResponse.json({ error: "purchase_insert_failed" }, { status: 500 });
  }

  try {
    const checkout = await createSumUpCheckout({
      reference: `ABIL-TOMBOLA-${purchase.id}`,
      amount: totalAmount,
      description: `Tombola Tour des Héraults — ${ids.length} ticket(s)`,
      redirectUrl: `${appUrl}/success?purchase_id=${purchase.id}`
    });

    await supabase
      .from("purchases")
      .update({
        sumup_checkout_id: checkout.id,
        sumup_checkout_url: checkout.hosted_checkout_url ?? null
      })
      .eq("id", purchase.id);

    return NextResponse.json({
      purchaseId: purchase.id,
      checkoutUrl: checkout.hosted_checkout_url
    });
  } catch (err: any) {
    await supabase
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id);
    return NextResponse.json(
      { error: "sumup_failed", message: err?.message },
      { status: 502 }
    );
  }
}

async function handleBundle(
  bundleId: unknown,
  buyer: BuyerPayload,
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  appUrl: string
) {
  if (typeof bundleId !== "string") {
    return NextResponse.json({ error: "invalid_bundle" }, { status: 400 });
  }
  const { data: bundle, error: bundleErr } = await supabase
    .from("bundles")
    .select("*")
    .eq("id", bundleId)
    .single();
  if (bundleErr || !bundle) {
    return NextResponse.json({ error: "unknown_bundle" }, { status: 404 });
  }
  if (bundle.status !== "available" || !bundle.is_active) {
    return NextResponse.json({ error: "bundle_unavailable" }, { status: 409 });
  }

  const { data: subTickets, error: subErr } = await supabase
    .from("tickets")
    .select("id")
    .eq("bundle_id", bundleId);
  if (subErr || !subTickets || subTickets.length === 0) {
    return NextResponse.json({ error: "bundle_tickets_missing" }, { status: 500 });
  }
  const ticketIds = subTickets.map((t) => t.id as string);

  const totalAmount = Number(bundle.special_price);

  const { data: purchase, error: insertErr } = await supabase
    .from("purchases")
    .insert({
      buyer_first_name: buyer.firstName,
      buyer_last_name: buyer.lastName,
      buyer_club: buyer.club,
      buyer_phone: buyer.phone,
      ticket_ids: ticketIds,
      total_amount: totalAmount,
      status: "pending"
    })
    .select()
    .single();
  if (insertErr || !purchase) {
    return NextResponse.json({ error: "purchase_insert_failed" }, { status: 500 });
  }

  try {
    const checkout = await createSumUpCheckout({
      reference: `ABIL-TOMBOLA-${purchase.id}`,
      amount: totalAmount,
      description: `Tombola — Bundle ${bundle.player_name} (×5)`,
      redirectUrl: `${appUrl}/success?purchase_id=${purchase.id}&bundle=${bundle.id}`
    });

    await supabase
      .from("purchases")
      .update({
        sumup_checkout_id: checkout.id,
        sumup_checkout_url: checkout.hosted_checkout_url ?? null
      })
      .eq("id", purchase.id);

    return NextResponse.json({
      purchaseId: purchase.id,
      bundleId: bundle.id,
      checkoutUrl: checkout.hosted_checkout_url
    });
  } catch (err: any) {
    await supabase
      .from("purchases")
      .update({ status: "failed" })
      .eq("id", purchase.id);
    return NextResponse.json(
      { error: "sumup_failed", message: err?.message },
      { status: 502 }
    );
  }
}
