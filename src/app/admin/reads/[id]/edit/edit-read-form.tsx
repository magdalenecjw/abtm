"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRead, type ReadDetail } from "../../actions";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
export function EditReadForm({ read }: { read: ReadDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(read.title);
  const [author, setAuthor] = useState(read.author);
  const [genre, setGenre] = useState(read.genre ?? "");
  const [rating, setRating] = useState(read.rating?.toString() ?? "");
  const [notes, setNotes] = useState(read.notes ?? "");
  const [dateRead, setDateRead] = useState(read.dateRead ?? "");
  const [source, setSource] = useState<"" | "Owned" | "NLB">(
    read.source ?? "",
  );
  const [bookIdCode, setBookIdCode] = useState(read.bookIdCode ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateRead(read.id, {
        title,
        author,
        genre,
        rating,
        notes,
        dateRead,
        source,
        bookIdCode,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/reads");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md">
      <label htmlFor="title">Title</label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-400 px-2 py-1"
        required
      />

      <label htmlFor="author">Author</label>
      <input
        id="author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="border border-gray-400 px-2 py-1"
        required
      />

      <label htmlFor="genre">Genre</label>
      <input
        id="genre"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="border border-gray-400 px-2 py-1"
      />

      <label htmlFor="rating">Rating</label>
      <input
        id="rating"
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="border border-gray-400 px-2 py-1"
      />

      <label htmlFor="notes">Notes</label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="border border-gray-400 px-2 py-1"
      />

      <label htmlFor="dateRead">Date read</label>
      <input
        id="dateRead"
        type="date"
        value={dateRead}
        onChange={(e) => setDateRead(e.target.value)}
        className="border border-gray-400 px-2 py-1"
      />

      <label htmlFor="source">Source</label>
      <select
        id="source"
        value={source}
        onChange={(e) => setSource(e.target.value as "" | "Owned" | "NLB")}
        className="border border-gray-400 px-2 py-1"
      >
        <option value="">(none/other)</option>
        <option value="Owned">Owned</option>
        <option value="NLB">NLB</option>
      </select>

      <label htmlFor="bookIdCode">
        Linked book_id (e.g. BK0001 — leave blank to unlink)
      </label>
      <input
        id="bookIdCode"
        value={bookIdCode}
        onChange={(e) => setBookIdCode(e.target.value)}
        className="border border-gray-400 px-2 py-1"
      />

      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="border border-gray-400 px-3 py-1 self-start"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}