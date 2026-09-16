import Link from "next/link";
import { AppBrand } from "../app-brand";

export function AdminHeader() {
  return (
    <header className="mb-8">
      <AppBrand />
      <nav className="flex flex-wrap items-center gap-4 text-sm pt-4 border-t border-[var(--rule)]">
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
        <Link href="/" className="text-link ml-auto opacity-60 text-xs">
          View site
        </Link>
      </nav>
    </header>
  );
}