"use client";

import { useRef, useState, useTransition } from "react";
import {
  previewGoodreadsImport,
  applyGoodreadsImport,
  type GoodreadsApplyRow,
  type GoodreadsApplyResult,
} from "./actions";
import type { GoodreadsMatchResult } from "@/lib/goodreads/match";

type RowState = {
  match: GoodreadsMatchResult;
  source: "" | "Owned" | "NLB";
  bookIdCode: string;
  rating: string;
  notes: string;
};

type Phase =
  | { step: "idle" }
  | { step: "errors"; errors: string[] }
  | { step: "preview"; rows: RowState[]; alreadyImportedCount: number }
  | { step: "result"; result: GoodreadsApplyResult };

function toRowState(match: GoodreadsMatchResult): RowState {
  return {
    match,
    // Auto-matched rows default to Owned + the matched book_id code,
    // per workflows.md §7.3 — admin can still change this before
    // applying.
    source: match.matchedBook ? "Owned" : "",
    bookIdCode: match.matchedBook?.book_id ?? "",
    rating: match.row.rating?.toString() ?? "",
    notes: match.row.notes ?? "",
  };
}

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
//
// Book linking uses a plain text input for the book_id CODE (e.g.
// "BK0001") rather than a full search-by-title/author picker widget
// — a pragmatic simplification at this project's personal-library
// scale, consistent with the same simplification used on the read
// edit form (src/app/admin/reads/[id]/edit/edit-read-form.tsx).
export function GoodreadsImportForm() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handlePreviewSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await previewGoodreadsImport(formData);
      if (result.status === "errors") {
        setPhase({ step: "errors", errors: result.errors });
      } else {
        setPhase({
          step: "preview",
          rows: result.toImport.map(toRowState),
          alreadyImportedCount: result.alreadyImportedCount,
        });
      }
    });
  }

  function updateRow(index: number, patch: Partial<RowState>) {
    setPhase((prev) => {
      if (prev.step !== "preview") return prev;
      const rows = prev.rows.slice();
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, rows };
    });
  }

  function handleApply(rows: RowState[]) {
    const applyRows: GoodreadsApplyRow[] = rows.map((r) => ({
      goodreadsId: r.match.row.goodreadsId,
      title: r.match.row.title,
      author: r.match.row.author,
      dateRead: r.match.row.dateRead,
      rating: r.rating.trim() ? Number(r.rating) : null,
      notes: r.notes || null,
      source: r.source,
      bookIdCode: r.bookIdCode,
    }));

    startTransition(async () => {
      const result = await applyGoodreadsImport(applyRows);
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
          <label htmlFor="file">Goodreads library export (.csv)</label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv"
            required
            disabled={isPending}
          />
          <button type="submit" disabled={isPending}>
            {isPending ? "Checking…" : "Preview import"}
          </button>
        </form>
      )}

      {phase.step === "errors" && (
        <div role="alert">
          <p>This file has problems — fix them and re-upload:</p>
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
          <p>
            To import: {phase.rows.length} — Already imported:{" "}
            {phase.alreadyImportedCount}
          </p>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="p-2">Title</th>
                <th className="p-2">Author</th>
                <th className="p-2">Source</th>
                <th className="p-2">Linked book_id</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {phase.rows.map((r, i) => (
                <tr key={r.match.row.goodreadsId} className="border-b border-gray-200">
                  <td className="p-2">{r.match.row.title}</td>
                  <td className="p-2">{r.match.row.author}</td>
                  <td className="p-2">
                    <select
                      value={r.source}
                      onChange={(e) =>
                        updateRow(i, {
                          source: e.target.value as "" | "Owned" | "NLB",
                        })
                      }
                      disabled={isPending}
                    >
                      <option value="">(none/other)</option>
                      <option value="Owned">Owned</option>
                      <option value="NLB">NLB</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {r.source === "Owned" && (
                      <input
                        value={r.bookIdCode}
                        onChange={(e) =>
                          updateRow(i, { bookIdCode: e.target.value })
                        }
                        disabled={isPending}
                        className="border border-gray-400 px-1"
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      value={r.rating}
                      onChange={(e) => updateRow(i, { rating: e.target.value })}
                      disabled={isPending}
                      className="border border-gray-400 px-1 w-12"
                    />
                  </td>
                  <td className="p-2">
                    <textarea
                      value={r.notes}
                      onChange={(e) => updateRow(i, { notes: e.target.value })}
                      disabled={isPending}
                      className="border border-gray-400 px-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={() => handleApply(phase.rows)}
            disabled={isPending}
          >
            {isPending ? "Importing…" : "Apply"}
          </button>
          <button type="button" onClick={reset} disabled={isPending}>
            Cancel
          </button>
        </div>
      )}

      {phase.step === "result" && phase.result.ok && (
        <div>
          <p>Import applied successfully.</p>
          <ul>
            <li>Imported: {phase.result.importedCount}</li>
            <li>Already imported: {phase.result.alreadyImportedCount}</li>
          </ul>
          <button type="button" onClick={reset}>
            Import another file
          </button>
        </div>
      )}

      {phase.step === "result" && !phase.result.ok && (
        <div role="alert">
          <p>Import failed: {phase.result.error}</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}