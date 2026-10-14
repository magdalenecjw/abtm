import Link from "next/link";
import type { CSSProperties } from "react";
import { AdminHeader } from "./admin-header";
import { AdminPageHeading } from "./admin-page-heading";
import { getDashboardStats } from "./dashboard-actions";
import { formatLongDate } from "@/lib/borrowing/receipt";

type Tile = { label: string; value: number; href: string };

/**
 * One ledger tile: a number and a link into the filtered screen.
 * `needsYou` tiles get a terracotta dot when above zero; zeros are
 * muted (visual-system.md §14.3).
 */
function LedgerTile({
  tile,
  needsYou = false,
}: {
  tile: Tile;
  needsYou?: boolean;
}) {
  const flagged = needsYou && tile.value > 0;
  const className = [
    "ledger-tile",
    flagged ? "ledger-tile-flagged" : "",
    tile.value === 0 ? "ledger-tile-zero" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={tile.href} className={className}>
      <span className="ledger-num">{tile.value}</span>
      <span className="ledger-cap">
        {flagged && <span className="ledger-dot" aria-hidden="true" />}
        {tile.label}
        {flagged && <span className="sr-only"> — needs attention</span>}
      </span>
      <span className="ledger-go" aria-hidden="true">
        {needsYou ? "Review →" : "Open →"}
      </span>
    </Link>
  );
}

function LedgerGroup({
  title,
  tiles,
  needsYou = false,
}: {
  title: string;
  tiles: Tile[];
  needsYou?: boolean;
}) {
  return (
    <section className="ledger-group" aria-labelledby={`ledger-${title}`}>
      <h2 id={`ledger-${title}`} className="ledger-group-title">
        {title}
      </h2>
      <div
        className="ledger-tiles"
        style={{ "--cols": tiles.length } as CSSProperties}
      >
        {tiles.map((t) => (
          <LedgerTile key={t.label} tile={t} needsYou={needsYou} />
        ))}
      </div>
    </section>
  );
}

// "Today's ledger" — the admin dashboard (ui-specification.md §2.2,
// visual-system.md §14.3): the same eight figures as before, grouped
// into what needs attention and the state of the library. Each tile
// links into the relevant filtered screen.
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const needsAttention: Tile[] = [
    {
      label: "Pending requests",
      value: stats.pendingRequests,
      href: "/admin/requests?submitted=1&pending=1",
    },
    {
      label: "Not yet collected",
      value: stats.notYetCollected,
      href: "/admin/requests?submitted=1&approved=1&flags=not_yet_collected",
    },
    {
      label: "Long loans",
      value: stats.longLoan,
      href: "/admin/requests?submitted=1&approved=1&flags=needs_attention&flags=long_loan&flags=very_long_loan",
    },
  ];

  const library: Tile[] = [
    { label: "Total books", value: stats.totalBooks, href: "/admin/books" },
    {
      label: "Available",
      value: stats.available,
      href: "/admin/books?status=available",
    },
    {
      label: "Checked out",
      value: stats.checkedOut,
      href: "/admin/books?status=checked_out",
    },
    {
      label: "On loan",
      value: stats.onLoan,
      href: "/admin/books?status=on_loan",
    },
    { label: "Books read", value: stats.totalReads, href: "/admin/reads" },
  ];

  return (
    <main className="admin-page">
      <AdminHeader current="ledger" />
      <AdminPageHeading
        eyebrow={formatLongDate()}
        title="Today's ledger"
        note="Dots mark what needs you."
      />
      <div className="ledger">
        <LedgerGroup title="Needs attention" tiles={needsAttention} needsYou />
        <LedgerGroup title="The library" tiles={library} />
      </div>
    </main>
  );
}
