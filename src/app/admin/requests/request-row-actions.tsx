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

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). All actions
// are immediate on click, no confirmation dialogs — consistent with
// workflows.md §5.4's "low-stakes, single-admin tool" reasoning.
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
    <div className="flex flex-col gap-1">
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      {regeneratedLink && (
        <div role="alert" className="text-sm border border-gray-400 p-1">
          <p>New link (copy and send manually — shown once):</p>
          <p className="break-all">
            {typeof window !== "undefined" ? window.location.origin : ""}
            /request/manage/{regeneratedLink}
          </p>
        </div>
      )}

      {request.status === "pending" && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runSimple(() => approveRequest(request.id))}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runSimple(() => cancelRequestAsAdmin(request.id))}
          >
            Cancel
          </button>
          <button type="button" disabled={isPending} onClick={runRegenerate}>
            Regenerate link
          </button>
        </div>
      )}

      {request.status === "approved" && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={collectionDateInput}
              onChange={(e) => setCollectionDateInput(e.target.value)}
              disabled={isPending}
            />
            <button
              type="button"
              disabled={isPending || !collectionDateInput}
              onClick={() =>
                runSimple(() => markCollected(request.id, collectionDateInput))
              }
            >
              {request.collectionDate
                ? "Update collection date"
                : "Mark collected"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => markReturned(request.id))}
            >
              Mark returned
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => cancelRequestAsAdmin(request.id))}
            >
              Cancel
            </button>
            <button type="button" disabled={isPending} onClick={runRegenerate}>
              Regenerate link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}