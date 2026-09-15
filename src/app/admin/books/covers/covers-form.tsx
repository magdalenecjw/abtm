"use client";

import { useRef, useState, useTransition } from "react";
import { validateCoverFile } from "@/lib/covers/validate";
import { stripExtension } from "@/lib/covers/match";
import {
  previewCoverMatch,
  applyCovers,
  type CoverApplyResult,
} from "./actions";
import type { CoverFileMatch } from "@/lib/covers/match";

type PreviewEntry = {
  file: File;
  previewUrl: string;
  validationError: string | null;
  match: CoverFileMatch | null;
};

type Phase =
  | { step: "idle" }
  | { step: "preview"; entries: PreviewEntry[] }
  | { step: "result"; results: CoverApplyResult[] };

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
export function CoversForm() {
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    startTransition(async () => {
      // Client-side validation (format/size) needs no server round trip.
      const withValidation = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        validationError: validateCoverFile({
          name: file.name,
          size: file.size,
          type: file.type,
        }),
      }));

      // Matching needs DB knowledge, so only ask the server about
      // files that already passed local validation.
      const namesToMatch = withValidation
        .filter((f) => !f.validationError)
        .map((f) => stripExtension(f.file.name));
      const matches =
        namesToMatch.length > 0 ? await previewCoverMatch(namesToMatch) : [];
      const matchByName = new Map(matches.map((m) => [m.filename, m]));

      const entries: PreviewEntry[] = withValidation.map((f) => ({
        file: f.file,
        previewUrl: f.previewUrl,
        validationError: f.validationError,
        match: f.validationError
          ? null
          : (matchByName.get(stripExtension(f.file.name)) ?? null),
      }));

      setPhase({ step: "preview", entries });
    });
  }

  function handleApply(entries: PreviewEntry[]) {
    const applicable = entries.filter(
      (e) => !e.validationError && e.match?.status !== "unmatched",
    );

    const formData = new FormData();
    for (const entry of applicable) {
      formData.append("files", entry.file);
    }

    startTransition(async () => {
      const results = await applyCovers(formData);
      setPhase({ step: "result", results });
    });
  }

  function reset() {
    if (inputRef.current) inputRef.current.value = "";
    setPhase({ step: "idle" });
  }

  return (
    <div>
      {phase.step === "idle" && (
        <div>
          <label htmlFor="cover-files">
            Cover image(s) — filename must exactly match a book_id (e.g.
            BK0001.jpg)
          </label>
          <input
            ref={inputRef}
            id="cover-files"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            disabled={isPending}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          {isPending && <p>Checking files…</p>}
        </div>
      )}

      {phase.step === "preview" && (
        <div>
          <h2>Preview</h2>
          <ul className="flex flex-wrap gap-4 list-none p-0">
            {phase.entries.map((entry, i) => (
              <li key={i} className="w-32">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote/static asset */}
                <img
                  src={entry.previewUrl}
                  alt={entry.file.name}
                  className="w-32 h-32 object-cover border border-gray-400"
                />
                <p className="text-sm break-all">{entry.file.name}</p>
                {entry.validationError && (
                  <p role="alert" className="text-sm">
                    {entry.validationError}
                  </p>
                )}
                {!entry.validationError && entry.match?.status === "new" && (
                  <p className="text-sm">New cover for {entry.match.bookIdCode}</p>
                )}
                {!entry.validationError &&
                  entry.match?.status === "replacement" && (
                    <p className="text-sm">
                      Will replace existing cover for {entry.match.bookIdCode}
                    </p>
                  )}
                {!entry.validationError &&
                  entry.match?.status === "unmatched" && (
                    <p role="alert" className="text-sm">
                      No matching book — will not be uploaded
                    </p>
                  )}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => handleApply(phase.entries)}
            disabled={isPending}
          >
            {isPending ? "Uploading…" : "Apply"}
          </button>
          <button type="button" onClick={reset} disabled={isPending}>
            Cancel
          </button>
        </div>
      )}

      {phase.step === "result" && (
        <div>
          <h2>Result</h2>
          <ul>
            {phase.results.map((r, i) => (
              <li key={i}>
                {r.filename}: {r.ok ? "Uploaded" : `Failed — ${r.reason}`}
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>
            Upload more
          </button>
        </div>
      )}
    </div>
  );
}