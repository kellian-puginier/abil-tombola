const SUMUP_BASE = "https://api.sumup.com/v0.1";

export type SumUpCheckoutStatus = "PENDING" | "PAID" | "UNPAID" | "FAILED" | "EXPIRED";

export interface SumUpCheckout {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  status: SumUpCheckoutStatus;
  hosted_checkout_url?: string;
}

interface CreateCheckoutParams {
  reference: string;
  amount: number;
  description: string;
  redirectUrl: string;
}

function authHeader() {
  const key = process.env.SUMUP_API_KEY;
  if (!key) throw new Error("SUMUP_API_KEY is not set");
  return { Authorization: `Bearer ${key}` };
}

export async function createSumUpCheckout(
  params: CreateCheckoutParams
): Promise<SumUpCheckout> {
  const merchant = process.env.SUMUP_MERCHANT_CODE;
  if (!merchant) throw new Error("SUMUP_MERCHANT_CODE is not set");

  const res = await fetch(`${SUMUP_BASE}/checkouts`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      checkout_reference: params.reference,
      amount: params.amount,
      currency: "EUR",
      merchant_code: merchant,
      description: params.description,
      redirect_url: params.redirectUrl,
      hosted_checkout: { enabled: true }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SumUp createCheckout failed: ${res.status} ${text}`);
  }
  return (await res.json()) as SumUpCheckout;
}

export async function getSumUpCheckout(id: string): Promise<SumUpCheckout> {
  const res = await fetch(`${SUMUP_BASE}/checkouts/${id}`, {
    headers: authHeader(),
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SumUp getCheckout failed: ${res.status} ${text}`);
  }
  return (await res.json()) as SumUpCheckout;
}

export function verifySumUpWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.SUMUP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;

  // SumUp signs webhooks with HMAC-SHA256(base64). The signature header
  // is documented as `X-Sumup-Signature: sha256=...`.
  const expected = require("crypto")
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const provided = signature.replace(/^sha256=/, "").trim();
  if (expected.length !== provided.length) return false;
  try {
    return require("crypto").timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  } catch {
    return false;
  }
}
