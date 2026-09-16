"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelRequestByToken } from "@/app/borrow-actions";

/**
 * After cancelling, calls router.refresh() rather than updating local
 * state optimistically — this re-runs the parent Server Component's
 * fetch, so the page always reflects fresh server truth
 * (workflows.md §4.4's "always re-fetch and re-render from server
 * truth" approach), consistent with how the page loads in the first
 * place.
 */
export function CancelButton({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelRequestByToken(token);
      if (result.status !== "cancelled") {
        setMessage(
          result.status === "not_pending"
            ? `This request is already ${result.currentStatus}.`
            : "This request link is invalid or no longer available.",
        );
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="destructive-button"
      >
        {isPending ? "Cancelling…" : "Cancel request"}
      </button>
      {message && (
        <p className="text-sm mt-2 text-[var(--terracotta)]" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}