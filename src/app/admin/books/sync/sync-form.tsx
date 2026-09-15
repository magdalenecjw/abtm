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

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied anywhere in the app (Phase 6 of the build).
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
          <label htmlFor="file">Catalogue spreadsheet (.xlsx)</label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx"
            required
            disabled={isPending}
          />
          <button type="submit" disabled={isPending}>
            {isPending ? "Checking…" : "Preview sync"}
          </button>
        </form>
      )}

      {phase.step === "errors" && (
        <div role="alert">
          <p>
            This file has {phase.errors.length}{" "}
            {phase.errors.length === 1 ? "problem" : "problems"} — fix all of
            them and re-upload:
          </p>
          <ul>
            {phase.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {phase.step === "preview" && (
        <div>
          <h2>Preview</h2>
          <ul>
            <li>New: {phase.preview.newRows.length}</li>
            <li>Updated: {phase.preview.updatedRows.length}</li>
            <li>Unchanged: {phase.preview.unchangedCount}</li>
            <li>Missing from spreadsheet: {phase.preview.missingBookIds.length}</li>
          </ul>

          {phase.preview.newRows.length > 0 && (
            <section>
              <h3>New books</h3>
              <ul>
                {phase.preview.newRows.map((row) => (
                  <li key={row.book_id}>
                    {row.book_id} — {row.title} by {row.author} ({row.genre})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {phase.preview.updatedRows.length > 0 && (
            <section>
              <h3>Updated books</h3>
              <ul>
                {phase.preview.updatedRows.map(({ row, diffs }) => (
                  <li key={row.book_id}>
                    {row.book_id} — {row.title}
                    <ul>
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
            <section>
              <h3>Missing from spreadsheet (no action taken)</h3>
              <p>
                These book_ids exist in the catalogue but were not in this
                upload. Nothing has been changed for them — this is
                informational only.
              </p>
              <ul>
                {phase.preview.missingBookIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            onClick={() => handleApply(phase.rows)}
            disabled={isPending}
          >
            {isPending ? "Applying…" : "Apply"}
          </button>
          <button type="button" onClick={reset} disabled={isPending}>
            Cancel
          </button>
        </div>
      )}

      {phase.step === "result" && phase.result.status === "success" && (
        <div>
          <p>Sync applied successfully.</p>
          <ul>
            <li>New: {phase.result.newCount}</li>
            <li>Updated: {phase.result.updatedCount}</li>
            <li>Unchanged: {phase.result.unchangedCount}</li>
            <li>
              Missing from spreadsheet: {phase.result.missingBookIds.length}
            </li>
          </ul>
          <button type="button" onClick={reset}>
            Sync another file
          </button>
        </div>
      )}

      {phase.step === "result" && phase.result.status === "error" && (
        <div role="alert">
          <p>Sync failed: {phase.result.error}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}