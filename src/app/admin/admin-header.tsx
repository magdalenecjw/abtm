import Link from "next/link";
import Image from "next/image";
import { logout } from "./actions";
import { AdminMenuBehaviour } from "./admin-menu-behaviour";

export type AdminPage =
  "ledger" | "requests" | "books" | "sync" | "covers" | "reads" | "import";

const CATALOGUE: { page: AdminPage; href: string; label: string }[] = [
  { page: "books", href: "/admin/books", label: "Books" },
  { page: "sync", href: "/admin/books/sync", label: "Sync spreadsheet" },
  { page: "covers", href: "/admin/books/covers", label: "Covers" },
];

const READS: { page: AdminPage; href: string; label: string }[] = [
  { page: "reads", href: "/admin/reads", label: "Reading list" },
  { page: "import", href: "/admin/reads/import", label: "Import Goodreads" },
];

/**
 * Back-office header (visual-system.md §14.1, ui-specification.md §2.1):
 * a top-bar menu with Catalogue and My Reads as drop-downs, the current
 * page as a filled pill, and View site / Sign out on the right.
 *
 * Drop-downs are native <details>, so they open and close without
 * JavaScript; AdminMenuBehaviour only adds niceties (one open at a
 * time, close on outside click or Escape).
 *
 * `current` is passed by each page, keeping this a Server Component.
 */
export function AdminHeader({ current }: { current: AdminPage }) {
  const inCatalogue = CATALOGUE.some((l) => l.page === current);
  const inReads = READS.some((l) => l.page === current);

  return (
    <header className="admin-header">
      <Link href="/admin" className="admin-brand">
        <Image
          src="/logo-icon.png"
          alt=""
          width={32}
          height={32}
          className="rounded-[3px]"
        />
        <span>Back office</span>
      </Link>

      <nav aria-label="Back office" className="admin-nav">
        <Link
          href="/admin"
          className="admin-nav-link"
          aria-current={current === "ledger" ? "page" : undefined}
        >
          Today&apos;s ledger
        </Link>
        <Link
          href="/admin/requests"
          className="admin-nav-link"
          aria-current={current === "requests" ? "page" : undefined}
        >
          Requests
        </Link>
        <MenuGroup
          label="Catalogue"
          links={CATALOGUE}
          current={current}
          active={inCatalogue}
        />
        <MenuGroup
          label="My Reads"
          links={READS}
          current={current}
          active={inReads}
        />
      </nav>

      <div className="admin-header-right">
        <Link href="/" className="admin-quiet-link">
          View site
        </Link>
        <form action={logout}>
          <button type="submit" className="admin-quiet-link">
            Sign out
          </button>
        </form>
      </div>

      <AdminMenuBehaviour />
    </header>
  );
}

function MenuGroup({
  label,
  links,
  current,
  active,
}: {
  label: string;
  links: { page: AdminPage; href: string; label: string }[];
  current: AdminPage;
  active: boolean;
}) {
  return (
    <details className="admin-menu-group" data-active={active || undefined}>
      <summary className="admin-nav-link">
        {label}{" "}
        <span aria-hidden="true" className="admin-caret">
          ▾
        </span>
      </summary>
      <div className="admin-menu">
        {links.map((l) => (
          <Link
            key={l.page}
            href={l.href}
            aria-current={l.page === current ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
