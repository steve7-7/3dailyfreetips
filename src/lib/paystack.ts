/**
 * Paystack integration.
 *
 * Live mode is activated automatically when PAYSTACK_SECRET_KEY is present.
 * Otherwise the app falls back to a fully working mock checkout flow so the
 * upgrade experience can be demoed end-to-end without real credentials.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

export function getPaystackMode(): "live" | "mock" {
  return process.env.PAYSTACK_SECRET_KEY ? "live" : "mock";
}

export interface InitializeResult {
  mode: "live" | "mock";
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
}

export interface VerifyResult {
  status: "success" | "failed" | "pending";
  amount: number;
  gatewayResponse: string;
}

function appOrigin(requestOrigin?: string): string {
  return (
    requestOrigin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}

export async function initializePayment(params: {
  email: string;
  amount: number; // NGN (naira)
  plan: string;
  reference: string;
  requestOrigin?: string;
}): Promise<InitializeResult> {
  const { email, amount, plan, reference, requestOrigin } = params;
  const origin = appOrigin(requestOrigin);

  if (getPaystackMode() === "live") {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // convert to kobo
        reference,
        callback_url: `${origin}/api/paystack/callback`,
        metadata: { plan, custom_fields: [{ display_name: "Plan", value: plan }] },
      }),
    });
    const data = await res.json();
    if (!data?.status) {
      throw new Error(data?.message || "Paystack initialization failed");
    }
    return {
      mode: "live",
      reference: data.data.reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
    };
  }

  // Mock mode — simulate the redirect to a hosted checkout.
  return {
    mode: "mock",
    reference,
    authorizationUrl: `${origin}/pay/${reference}`,
    accessCode: `mock_${reference}`,
  };
}

export async function verifyPayment(
  reference: string,
): Promise<VerifyResult> {
  if (getPaystackMode() === "live") {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.status;
    return {
      status:
        status === "success"
          ? "success"
          : status === "failed"
            ? "failed"
            : "pending",
      amount: (data?.data?.amount ?? 0) / 100,
      gatewayResponse: data?.data?.gateway_response || data?.message || "Verified",
    };
  }

  // Mock mode — auto-confirm the transaction.
  return {
    status: "success",
    amount: 0,
    gatewayResponse: "Mock payment successful",
  };
}
