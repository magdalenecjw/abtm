import Link from "next/link";
import { AdminHeader } from "./admin-header";
import { getDashboardStats } from "./dashboard-actions";
import { logout } from "./actions";

function StatBox({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border border-[var(--rule)] rounded-[3px] p-3 hover:border-[var(--accent)] transition-colors"
    >
      <p className="text-xl font-caslon">{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </Link>
  );
}

// Eight clickable stat boxes, two rows of four, per
// ui-specification.md §2.2 — each box is both a number and a
// navigation shortcut into the relevant filtered screen.
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:px-8">
      <AdminHeader />
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-heading">Dashboard</h1>
        <form action={logout}>
          <button type="submit" className="secondary-button">
            Sign out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
        <StatBox label="Total books" value={stats.totalBooks} href="/admin/books" />
        <StatBox
          label="Available"
          value={stats.available}
          href="/admin/books?status=available"
        />
        <StatBox
          label="Checked out"
          value={stats.checkedOut}
          href="/admin/books?status=checked_out"
        />
        <StatBox
          label="On loan"
          value={stats.onLoan}
          href="/admin/books?status=on_loan"
        />
        <StatBox
          label="Pending requests"
          value={stats.pendingRequests}
          href="/admin/requests?submitted=1&pending=1"
        />
        <StatBox
          label="Not yet collected"
          value={stats.notYetCollected}
          href="/admin/requests?submitted=1&approved=1&flags=not_yet_collected"
        />
        <StatBox
          label="Long loan"
          value={stats.longLoan}
          href="/admin/requests?submitted=1&approved=1&flags=needs_attention&flags=long_loan&flags=very_long_loan"
        />
        <StatBox label="Total reads" value={stats.totalReads} href="/admin/reads" />
      </div>
    </main>
  );
}
