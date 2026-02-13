"use client";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error";
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  return (
    <div
      className={`flex items-center gap-3 border bg-dark-card px-4 py-3 shadow-lg ${
        type === "success"
          ? "border-green-500/30"
          : "border-red-500/30"
      }`}
      role="status"
    >
      <span
        className={`text-[13px] ${
          type === "success" ? "text-green-400" : "text-red-400"
        }`}
      >
        {type === "success" ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </span>
      <span className="text-[13px] text-text-primary">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="ml-2 text-text-tertiary transition-colors hover:text-text-primary"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
