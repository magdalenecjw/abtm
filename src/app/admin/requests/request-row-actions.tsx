"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveRequest,
  cancelRequestAsAdmin,
  markCollected,
  markReturned,
  regenerateManagementLink,
  type ActionResult,
} from "./actions";
import type { AdminRequestRow } from "@/lib/borrowing/filter-requests";

// All actions are immediate on click, no confirmation dialogs —
// consistent with workflows.md §5.4's "low-stakes, single-admin
// tool" reasoning.
export function RequestRowActions({ request }: { request: AdminRequestRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [collectionDateInput, setCollectionDateInput] = useState(
    request.collectionDate ?? "",
  );
  const [regeneratedLink, setRegeneratedLink] = useState<string | null>(null);

  function runSimple(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function runRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateManagementLink(request.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRegeneratedLink(result.managementToken);
    });
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      {error && (
        <p role="alert" className="text-sm text-[var(--terracotta)]">
          {error}
        </p>
      )}

      {regeneratedLink && (
        <div
          role="alert"
          className="text-sm border border-[var(--terracotta)] rounded-[3px] p-2"
        >
          <p>New link (copy and send manually — shown once):</p>
          <p className="break-all">
            {typeof window !== "undefined" ? window.location.origin : ""}
            /request/manage/{regeneratedLink}
          </p>
        </div>
      )}

      {request.status === "pending" && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runSimple(() => approveRequest(request.id))}
            className="primary-button"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runSimple(() => cancelRequestAsAdmin(request.id))}
            className="destructive-button"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={runRegenerate}
            className="secondary-button"
          >
            Regenerate link
          </button>
        </div>
      )}

      {request.status === "approved" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              value={collectionDateInput}
              onChange={(e) => setCollectionDateInput(e.target.value)}
              disabled={isPending}
              className="search-input"
            />
            <button
              type="button"
              disabled={isPending || !collectionDateInput}
              onClick={() =>
                runSimple(() => markCollected(request.id, collectionDateInput))
              }
              className="secondary-button"
            >
              {request.collectionDate
                ? "Update collection date"
                : "Mark collected"}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => markReturned(request.id))}
              className="primary-button"
            >
              Mark returned
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => cancelRequestAsAdmin(request.id))}
              className="destructive-button"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={runRegenerate}
              className="secondary-button"
            >
              Regenerate link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
