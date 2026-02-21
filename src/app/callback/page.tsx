"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // OAuth code received — send to backend
      console.log("OAuth code received:", code);
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <>
          <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-dark-border border-t-text-primary" />
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Connecting to Darkscreens...
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            Please wait while we complete the connection.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <svg
              className="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Connected
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            You can close this window and return to the app.
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Connection Failed
          </h1>
          <p className="mt-3 text-[14px] text-text-secondary">
            No authorization code was received. Please try again.
          </p>
        </>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-dark-border border-t-text-primary" />
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Connecting to Darkscreens...
            </h1>
            <p className="mt-3 text-[14px] text-text-secondary">
              Please wait while we complete the connection.
            </p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
