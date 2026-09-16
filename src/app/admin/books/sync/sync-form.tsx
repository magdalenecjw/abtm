"use client";

import { useRef, useState, useTransition } from "react";
import { previewUpload, applyUpload, type ApplyActionResult } from "./actions";
import type { SyncRow } from "@/lib/spreadsheet-sync/parse";
import type { PreviewResult } from "@/lib/spreadsheet-sync/preview";

type Phase =
  | { step: "idle" }
  | { step: "errors"; errors: string[] }
  | { step: "preview"; rows: SyncRow[]; preview: PreviewResult }
  | { step: "result"; result: ApplyActionResult };

export function SyncForm() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handlePreviewSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await previewUpload(formData);
      if (result.status === "errors") {
        setPhase({ step: "errors", errors: result.errors });
      } else {
        setPhase({ step: "preview", rows: result.rows, preview: result.preview });
      }
    });
  }

  function handleApply(rows: SyncRow[]) {
    startTransition(async () => {
      const result = await applyUpload(rows);
      setPhase({ step: "result", result });
    });
  }

  function reset() {
    formRef.current?.reset();
    setPhase({ step: "idle" });
  }

  return (
    <div>
      {(phase.step === "idle" || phase.step === "errors") && (
        <form ref={formRef} action={handlePreviewSubmit}>
          <label htmlFor="file" className="text-sm block mb-2">
            Catalogue spreadsheet (.xlsx)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx"
            required
            disabled={isPending}
            className="file-input"
          />
          <div className="mt-4">
            <button type="submit" disabled={isPending} className="primary-button">
              {isPending ? "Checking…" : "Preview sync"}
            </button>
          </div>
        </form>
      )}

      {phase.step === "errors" && (
        <div role="alert" className="mt-4 text-sm text-[var(--terracotta)]">
          <p className="mb-2">
            This file has {phase.errors.length}{" "}
            {phase.errors.length === 1 ? "problem" : "problems"} — fix all of
            them and re-upload:
          </p>
          <ul className="list-disc pl-5">
            {phase.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {phase.step === "preview" && (
        <div className="mt-2">
          <h2 className="book-title text-lg mb-3">Preview</h2>
          <ul className="text-sm mb-4">
            <li>New: {phase.preview.newRows.length}</li>
            <li>Updated: {phase.preview.updatedRows.length}</li>
            <li>Unchanged: {phase.preview.unchangedCount}</li>
            <li>Missing from spreadsheet: {phase.preview.missingBookIds.length}</li>
          </ul>

          {phase.preview.newRows.length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-medium mb-1">New books</h3>
              <ul className="text-sm list-disc pl-5">
                {phase.preview.newRows.map((row) => (
                  <li key={row.book_id}>
                    {row.book_id} — {row.title} by {row.author} ({row.genre})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {phase.preview.updatedRows.length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-medium mb-1">Updated books</h3>
              <ul className="text-sm list-disc pl-5">
                {phase.preview.updatedRows.map(({ row, diffs }) => (
                  <li key={row.book_id}>
                    {row.book_id} — {row.title}
                    <ul className="list-disc pl-5">
                      {diffs.map((diff) => (
                        <li key={diff.field}>
                          {diff.field}: {diff.oldValue} → {diff.newValue}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {phase.preview.missingBookIds.length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-medium mb-1">
                Missing from spreadsheet (no action taken)
              </h3>
              <p className="text-sm mb-2">
                These book_ids exist in the catalogue but were not in this
                upload. Nothing has been changed for them — this is
                informational only.
              </p>
              <ul className="text-sm list-disc pl-5">
                {phase.preview.missingBookIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleApply(phase.rows)}
              disabled={isPending}
              className="primary-button"
            >
              {isPending ? "Applying…" : "Apply"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={isPending}
              className="secondary-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase.step === "result" && phase.result.status === "success" && (
        <div className="mt-2">
          <p className="mb-2">Sync applied successfully.</p>
          <ul className="text-sm mb-4">
            <li>New: {phase.result.newCount}</li>
            <li>Updated: {phase.result.updatedCount}</li>
            <li>Unchanged: {phase.result.unchangedCount}</li>
            <li>
              Missing from spreadsheet: {phase.result.missingBookIds.length}
            </li>
          </ul>
          <button type="button" onClick={reset} className="secondary-button">
            Sync another file
          </button>
        </div>
      )}

      {phase.step === "result" && phase.result.status === "error" && (
        <div role="alert" className="mt-2">
          <p className="text-sm text-[var(--terracotta)] mb-2">
            Sync failed: {phase.result.error}
          </p>
          <button type="button" onClick={reset} className="secondary-button">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
