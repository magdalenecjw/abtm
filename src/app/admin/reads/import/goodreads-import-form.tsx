"use client";

import { useRef, useState, useTransition } from "react";
import {
  previewGoodreadsImport,
  applyGoodreadsImport,
  type GoodreadsApplyRow,
  type GoodreadsApplyResult,
} from "./actions";
import type { GoodreadsMatchResult } from "@/lib/goodreads/match";
import { BookPicker } from "@/app/admin/book-picker";

type RowState = {
  match: GoodreadsMatchResult;
  include: boolean;
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
    // Not part of the written spec — added on request, since manually
    // remembering to delete unwanted rows afterward (the only other
    // way to exclude something) is more error-prone than just not
    // importing it in the first place.
    include: true,
    // Auto-matched rows default to Owned + the matched book_id code,
    // per workflows.md §7.3 — admin can still change this before
    // applying.
    source: match.matchedBook ? "Owned" : "",
    bookIdCode: match.matchedBook?.book_id ?? "",
    rating: match.row.rating?.toString() ?? "",
    notes: match.row.notes ?? "",
  };
}

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
    const applyRows: GoodreadsApplyRow[] = rows
      .filter((r) => r.include)
      .map((r) => ({
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
          <label htmlFor="file" className="text-sm block mb-2">
            Goodreads library export (.csv)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv"
            required
            disabled={isPending}
            className="file-input"
          />
          <div className="mt-4">
            <button type="submit" disabled={isPending} className="primary-button">
              {isPending ? "Checking…" : "Preview import"}
            </button>
          </div>
        </form>
      )}

      {phase.step === "errors" && (
        <div role="alert" className="mt-4 text-sm text-[var(--terracotta)]">
          <p className="mb-2">This file has problems — fix them and re-upload:</p>
          <ul className="list-disc pl-5">
            {phase.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {phase.step === "preview" && (
        <div className="mt-2">
          <h2 className="book-title text-lg mb-2">Preview</h2>
          <p className="text-sm mb-4">
            To import: {phase.rows.filter((r) => r.include).length} of{" "}
            {phase.rows.length} — Already imported:{" "}
            {phase.alreadyImportedCount}
          </p>

          {/* This table has many interactive controls per row (select,
              book picker, inputs) — duplicating all of them into a
              separate mobile card layout would be complex and risky
              to get right without live testing. Since this is an
              occasional-use admin screen (not a frequently-used daily
              tool like Requests/Books/My Reads), a horizontal-scroll
              wrapper is a reasonable, lower-risk exception here. */}
          <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mb-4 min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--rule)] text-left">
                <th className="p-2">Include</th>
                <th className="p-2">Title</th>
                <th className="p-2">Author</th>
                <th className="p-2">Source</th>
                <th className="p-2">Linked book</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {phase.rows.map((r, i) => (
                <tr
                  key={r.match.row.goodreadsId}
                  className={`border-b border-[var(--rule)] ${r.include ? "" : "opacity-50"}`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) =>
                        updateRow(i, { include: e.target.checked })
                      }
                      disabled={isPending}
                    />
                  </td>
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
                      className="search-input"
                    >
                      <option value="">(none/other)</option>
                      <option value="Owned">Owned</option>
                      <option value="NLB">NLB</option>
                    </select>
                  </td>
                  <td className="p-2">
                    {r.source === "Owned" && (
                      <BookPicker
                        value={r.bookIdCode}
                        onChange={(code) =>
                          updateRow(i, { bookIdCode: code })
                        }
                        disabled={isPending}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      value={r.rating}
                      onChange={(e) => updateRow(i, { rating: e.target.value })}
                      disabled={isPending}
                      className="search-input w-14"
                    />
                  </td>
                  <td className="p-2">
                    <textarea
                      value={r.notes}
                      onChange={(e) => updateRow(i, { notes: e.target.value })}
                      disabled={isPending}
                      className="search-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleApply(phase.rows)}
              disabled={isPending}
              className="primary-button"
            >
              {isPending ? "Importing…" : "Apply"}
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

      {phase.step === "result" && phase.result.ok && (
        <div className="mt-2">
          <p className="mb-2">Import applied successfully.</p>
          <ul className="text-sm mb-4">
            <li>Imported: {phase.result.importedCount}</li>
            <li>Already imported: {phase.result.alreadyImportedCount}</li>
          </ul>
          <button type="button" onClick={reset} className="secondary-button">
            Import another file
          </button>
        </div>
      )}

      {phase.step === "result" && !phase.result.ok && (
        <div role="alert" className="mt-2">
          <p className="text-sm text-[var(--terracotta)] mb-2">
            Import failed: {phase.result.error}
          </p>
          <button type="button" onClick={reset} className="secondary-button">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
