"use client";

import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Redirect back to main Darkscreens site after brief confirmation
    const timer = setTimeout(() => {
      window.location.href = "https://darkscreens.xyz/checkout/success";
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "2rem",
    }}>
      <p style={{ fontSize: "14px", color: "#A1A1AA", marginBottom: "8px" }}>
        Payment confirmed
      </p>
      <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
        Redirecting to Darkscreens...
      </h1>
    </div>
  );
}
