"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRead, type ReadDetail } from "../../actions";
import { BookPicker } from "@/app/admin/book-picker";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
      <div>
        <label htmlFor="title" className="text-sm block mb-1">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="search-input"
          required
        />
      </div>

      <div>
        <label htmlFor="author" className="text-sm block mb-1">
          Author
        </label>
        <input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="search-input"
          required
        />
      </div>

      <div>
        <label htmlFor="genre" className="text-sm block mb-1">
          Genre
        </label>
        <input
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="search-input"
        />
      </div>

      <div>
        <label htmlFor="rating" className="text-sm block mb-1">
          Rating
        </label>
        <input
          id="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="search-input"
        />
      </div>

      <div>
        <label htmlFor="notes" className="text-sm block mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="search-input"
        />
      </div>

      <div>
        <label htmlFor="dateRead" className="text-sm block mb-1">
          Date read
        </label>
        <input
          id="dateRead"
          type="date"
          value={dateRead}
          onChange={(e) => setDateRead(e.target.value)}
          className="search-input"
        />
      </div>

      <div>
        <label htmlFor="source" className="text-sm block mb-1">
          Source
        </label>
        <select
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value as "" | "Owned" | "NLB")}
          className="search-input"
        >
          <option value="">(none/other)</option>
          <option value="Owned">Owned</option>
          <option value="NLB">NLB</option>
        </select>
      </div>

      <div>
        <label htmlFor="bookIdCode" className="text-sm block mb-1">
          Linked book (leave blank to unlink)
        </label>
        <BookPicker
          value={bookIdCode}
          onChange={setBookIdCode}
          disabled={isPending}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--terracotta)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="primary-button self-start"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
