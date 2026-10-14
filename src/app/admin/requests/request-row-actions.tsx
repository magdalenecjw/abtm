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
import { todayInLibraryTime } from "@/lib/borrowing/receipt";

// All actions are immediate on click, no confirmation dialogs —
// consistent with workflows.md §5.4's "low-stakes, single-admin
// tool" reasoning.
//
// Layout per visual-system.md §14.4: one obvious next step per row as
// a compact pill, with the rarer actions as small text links.
export function RequestRowActions({ request }: { request: AdminRequestRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Pre-filled with today (library time) so "Mark collected" works in
  // one click; editable for backdating, never in the future.
  const [collectionDateInput, setCollectionDateInput] = useState(
    request.collectionDate ?? todayInLibraryTime(),
  );
  const [editingCollected, setEditingCollected] = useState(false);
  const [regeneratedLink, setRegeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function runSimple(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingCollected(false);
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

  const newLink = regeneratedLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/request/manage/${regeneratedLink}`
    : "";

  function copyNewLink() {
    navigator.clipboard.writeText(newLink).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  }

  const cancelLink = (
    <button
      type="button"
      disabled={isPending}
      onClick={() => runSimple(() => cancelRequestAsAdmin(request.id))}
      className="admin-action-link"
    >
      Cancel
    </button>
  );
  const newLinkButton = (
    <button
      type="button"
      disabled={isPending}
      onClick={runRegenerate}
      className="admin-action-link"
    >
      New link
    </button>
  );

  const dateField = (
    <>
      <label htmlFor={`collected-${request.id}`} className="sr-only">
        Collection date
      </label>
      <input
        id={`collected-${request.id}`}
        type="date"
        value={collectionDateInput}
        max={todayInLibraryTime()}
        onChange={(e) => setCollectionDateInput(e.target.value)}
        disabled={isPending}
        className="admin-date-input"
      />
    </>
  );

  const isApproved = request.status === "approved";
  const isCollected = Boolean(request.collectionDate);

  return (
    <div className="admin-actions">
      {error && (
        <p role="alert" className="admin-action-error">
          {error}
        </p>
      )}

      {request.status === "pending" && (
        <div className="admin-action-row">
          <button
            type="button"
            disabled={isPending}
            onClick={() => runSimple(() => approveRequest(request.id))}
            className="primary-button admin-compact"
          >
            Approve
          </button>
          {cancelLink}
          {newLinkButton}
        </div>
      )}

      {isApproved && !isCollected && (
        <>
          <div className="admin-action-row">
            {dateField}
            <button
              type="button"
              disabled={isPending || !collectionDateInput}
              onClick={() =>
                runSimple(() => markCollected(request.id, collectionDateInput))
              }
              className="primary-button admin-compact"
            >
              Mark collected
            </button>
          </div>
          <div className="admin-action-row">
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => markReturned(request.id))}
              className="secondary-button admin-compact admin-quiet-pill"
            >
              Mark returned
            </button>
            {cancelLink}
            {newLinkButton}
          </div>
        </>
      )}

      {isApproved && isCollected && (
        <>
          <div className="admin-action-row">
            <button
              type="button"
              disabled={isPending}
              onClick={() => runSimple(() => markReturned(request.id))}
              className="primary-button admin-compact"
            >
              Mark returned
            </button>
          </div>
          {editingCollected && (
            <div className="admin-action-row">
              {dateField}
              <button
                type="button"
                disabled={isPending || !collectionDateInput}
                onClick={() =>
                  runSimple(() =>
                    markCollected(request.id, collectionDateInput),
                  )
                }
                className="secondary-button admin-compact"
              >
                Update
              </button>
            </div>
          )}
          <div className="admin-action-row">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setEditingCollected((v) => !v)}
              className="admin-action-link"
              aria-expanded={editingCollected}
            >
              {editingCollected ? "Keep collected date" : "Edit collected date"}
            </button>
            {cancelLink}
            {newLinkButton}
          </div>
        </>
      )}

      {regeneratedLink && (
        <div className="admin-new-link" role="status">
          <p className="admin-new-link-label">New link — shown once</p>
          <p className="admin-new-link-url">{newLink}</p>
          <button
            type="button"
            onClick={copyNewLink}
            className="secondary-button admin-compact"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <p className="admin-sub">
            Send it to the borrower yourself. Their old link no longer works.
          </p>
        </div>
      )}
    </div>
  );
}
