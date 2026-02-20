"use client";

import { Checkout } from "@moneydevkit/nextjs";

export default function CheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Checkout id={params.id} />
    </div>
  );
}
