import Link from "next/link";

export function AdminHeader() {
  return (
    <nav className="flex flex-wrap gap-4 text-sm mb-8 pb-4 border-b border-[var(--rule)]">
      <Link href="/admin" className="text-link">
        Dashboard
      </Link>
      <Link href="/admin/requests" className="text-link">
        Requests
      </Link>
      <Link href="/admin/books" className="text-link">
        Books
      </Link>
      <Link href="/admin/books/sync" className="text-link">
        Sync spreadsheet
      </Link>
      <Link href="/admin/books/covers" className="text-link">
        Covers
      </Link>
      <Link href="/admin/reads" className="text-link">
        My Reads
      </Link>
      <Link href="/admin/reads/import" className="text-link">
        Import Goodreads
      </Link>
    </nav>
  );
}