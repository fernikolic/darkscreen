"use client";

import { useState } from "react";

// Replace with your actual Bitcoin address
const BTC_ADDRESS = "bc1qYOUR_BTC_ADDRESS_HERE";

const PLANS = {
  pro: { name: "Pro", usd: "$9/mo", btcNote: "~$9 USD in BTC" },
  team: { name: "Team", usd: "$12/mo", btcNote: "~$12 USD in BTC" },
};

interface CryptoPayModalProps {
  plan: "pro" | "team";
  onClose: () => void;
}

export function CryptoPayModal({ plan, onClose }: CryptoPayModalProps) {
  const [copied, setCopied] = useState(false);
  const info = PLANS[plan];

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitcoin:${BTC_ADDRESS}&bgcolor=0C0C0E&color=F4F4F5`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(BTC_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md border border-dark-border bg-dark-card p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-tertiary transition-colors hover:text-text-primary"
        >
          &times;
        </button>

        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-accent-gold">
          Pay with Bitcoin
        </p>
        <h3 className="font-heading text-xl font-bold text-text-primary">
          Darkscreen {info.name}
        </h3>
        <p className="mt-1 text-[13px] text-text-secondary">
          {info.btcNote}
        </p>

        {/* QR Code */}
        <div className="mt-6 flex justify-center">
          <div className="border border-dark-border bg-dark-bg p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Bitcoin payment QR code"
              width={200}
              height={200}
              className="block"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            Bitcoin Address
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate border border-dark-border bg-dark-bg px-3 py-2 font-mono text-[12px] text-text-primary">
              {BTC_ADDRESS}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 border border-dark-border px-3 py-2 font-mono text-[11px] text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 space-y-2 text-[12px] text-text-tertiary">
          <p>1. Send the equivalent of {info.usd} in BTC to the address above</p>
          <p>2. Email your transaction hash to <span className="text-text-secondary">support@darkscreen.xyz</span></p>
          <p>3. We&apos;ll activate your account within 24 hours</p>
        </div>

        <button
          onClick={onClose}
          className="mt-8 block w-full border border-dark-border py-3 text-center text-[13px] font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
        >
          Done
        </button>
      </div>
    </div>
  );
}
