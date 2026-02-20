import { NextRequest, NextResponse } from "next/server";

const PRODUCT_IDS: Record<string, string> = {
  pro: "cmlty4h8e00k7ad0y0byw2cen",
  team: "cmlty4sid00kaad0ywk7stdvd",
  education: "cmlty5kgh00load0yqifbxjvp",
};

/**
 * GET /api/start?plan=pro&email=user@example.com
 *
 * Creates an MDK checkout by calling /api/mdk internally (server-to-server),
 * then redirects to /checkout/{id} with the correct public origin.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get("plan");
  const email = searchParams.get("email");

  if (!plan || !PRODUCT_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Resolve public origin from proxy headers
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  // Call /api/mdk internally via HTTP (Cloud Run serves HTTP internally)
  const port = process.env.PORT || "8080";
  const internalUrl = `http://localhost:${port}/api/mdk`;
  const res = await fetch(internalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-moneydevkit-webhook-secret": process.env.MDK_ACCESS_TOKEN || "",
    },
    body: JSON.stringify({
      handler: "create_checkout",
      params: {
        type: "PRODUCTS" as const,
        product: PRODUCT_IDS[plan],
        successUrl: "/checkout/success",
        ...(email && { customer: { email } }),
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    return NextResponse.json(body, { status: res.status });
  }

  const { data } = (await res.json()) as { data: { id: string } };
  return NextResponse.redirect(`${origin}/checkout/${data.id}`);
}
