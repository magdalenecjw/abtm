"use client";

import { useState, type ChangeEvent, type DragEvent, type Ref } from "react";

/**
 * Upload drop area (visual-system.md §14.5): a dashed, paper-filled box
 * that wraps a real <input type="file">, so it works with a click, the
 * keyboard, or by dragging files onto it. The input keeps its `name`
 * and `required`, so it still submits as part of a normal form.
 */
export function FileDrop({
  id,
  name,
  accept,
  multiple = false,
  required = false,
  disabled = false,
  inputRef,
  onFiles,
  title,
  hint,
}: {
  id: string;
  name?: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onFiles?: (files: FileList | null) => void;
  title: string;
  hint?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [chosen, setChosen] = useState<string>("");

  function describe(files: FileList | null) {
    if (!files || files.length === 0) return "";
    return files.length === 1 ? files[0].name : `${files.length} files chosen`;
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setChosen(describe(e.target.files));
    onFiles?.(e.target.files);
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const input = e.currentTarget.querySelector("input");
    if (!input || !e.dataTransfer.files.length) return;
    // Hand the dropped files to the real input, then let it report the
    // change exactly as if they'd been chosen with the picker.
    input.files = e.dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return (
    <label
      htmlFor={id}
      className="file-drop"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        onChange={handleChange}
        className="file-drop-input"
      />
      <span className="file-drop-title">{title}</span>
      {hint && <span className="file-drop-hint">{hint}</span>}
      <span className="secondary-button admin-compact file-drop-button">
        {multiple ? "Choose files" : "Choose file"}
      </span>
      <span className="file-drop-chosen" aria-live="polite">
        {chosen || "or drop here"}
      </span>
    </label>
  );
}
