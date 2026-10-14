import { AdminFooter, AdminHeader } from "../admin-header";
import { AdminPageHeading } from "../admin-page-heading";
import { getAllRequestsForAdmin } from "./actions";
import {
  filterRequests,
  type AdminRequestRow,
  type RequestStatus,
} from "@/lib/borrowing/filter-requests";
import { parseRequestFilters } from "@/lib/borrowing/parse-filters";
import {
  formatQueuePosition,
  pendingAheadCounts,
} from "@/lib/borrowing/queue-position";
import {
  daysSince,
  formatDateOnly,
  formatRequestedAt,
} from "@/lib/borrowing/receipt";
import { RequestRowActions } from "./request-row-actions";
import { AutoSubmitForm } from "./auto-submit-form";

const FLAG_LABEL: Record<string, string> = {
  not_yet_collected: "Not yet collected",
  needs_attention: "Needs attention",
  long_loan: "Long loan",
  very_long_loan: "Very long loan",
};

const STATUS_PILL: Record<RequestStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "status-checked-out" },
    approved: { label: "Approved", className: "status-available" },
    returned: { label: "Returned", className: "admin-status-muted" },
    cancelled: { label: "Cancelled", className: "admin-status-muted" },
  };

/** "10 Oct 2026" from a timestamp, in library time. */
function shortDate(iso: string): string {
  return formatRequestedAt(iso).split(",")[0];
}

/** The small line under the status pill (visual-system.md §14.4). */
function statusDetail(r: AdminRequestRow, ahead: number | undefined): string {
  if (r.status === "pending" && ahead !== undefined) {
    return formatQueuePosition(ahead);
  }
  if (r.status === "approved" && r.approvedAt) {
    return `Approved ${shortDate(r.approvedAt)}`;
  }
  if (r.status === "returned" && r.returnDate) {
    return `Returned ${shortDate(r.returnDate)}`;
  }
  return "";
}

function FlagPill({ flag }: { flag: AdminRequestRow["attentionFlag"] }) {
  if (!flag) return null;
  return <span className={`flag-pill flag-${flag}`}>{FLAG_LABEL[flag]}</span>;
}

function Collected({ r }: { r: AdminRequestRow }) {
  if (!r.collectionDate) return <span className="admin-muted">—</span>;
  const days = daysSince(r.collectionDate);
  return (
    <>
      <span>{formatDateOnly(r.collectionDate)}</span>
      {r.status === "approved" && (
        <span className="admin-sub">
          {days} {days === 1 ? "day" : "days"} out
        </span>
      )}
    </>
  );
}

function FilterPill({
  name,
  value,
  checked,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label className="filter-pill">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
      />
      <span>{label}</span>
    </label>
  );
}

// Requests (workflows.md §5.1–5.2, visual-system.md §14.4). Filters are
// still a plain GET form underneath — each pill is a styled checkbox —
// so they work without JavaScript; AutoSubmitForm applies them as soon
// as one changes.
export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseRequestFilters(sp);
  const allRequests = await getAllRequestsForAdmin();
  const requests = filterRequests(allRequests, filters);
  const ahead = pendingAheadCounts(
    allRequests.map((r) => ({
      id: r.id,
      bookKey: r.bookIdCode,
      status: r.status,
      requestedAt: r.requestedAt,
    })),
  );

  return (
    <main className="admin-page">
      <AdminHeader current="requests" />
      <AdminPageHeading
        title="Requests"
        note="Filters apply as soon as you change them."
      />

      <AutoSubmitForm className="admin-filters">
        <input type="hidden" name="submitted" value="1" />
        <div className="admin-filter-row">
          <span className="admin-filter-label">Status</span>
          <FilterPill
            name="pending"
            value="1"
            checked={filters.showPending}
            label="Pending"
          />
          <FilterPill
            name="approved"
            value="1"
            checked={filters.showApproved}
            label="Approved"
          />
          <FilterPill
            name="history"
            value="1"
            checked={filters.showHistory}
            label="Show history"
          />
        </div>
        <div className="admin-filter-row">
          <span className="admin-filter-label">Flags</span>
          {Object.entries(FLAG_LABEL).map(([value, label]) => (
            <FilterPill
              key={value}
              name="flags"
              value={value}
              checked={filters.flags.includes(
                value as (typeof filters.flags)[number],
              )}
              label={label}
            />
          ))}
        </div>
        <div className="admin-filter-row">
          <label htmlFor="q" className="admin-filter-label">
            Title
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.titleSearch}
            placeholder="Search by title"
            className="admin-search-line"
          />
        </div>
      </AutoSubmitForm>

      {requests.length === 0 ? (
        <p className="shelf-empty">No requests match these filters.</p>
      ) : (
        <>
          {/* Desktop/tablet: table */}
          <div className="admin-table-wrap admin-desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Collected</th>
                  <th>Flag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const pill = STATUS_PILL[r.status];
                  const detail = statusDetail(r, ahead.get(r.id));
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="admin-book-title">{r.bookTitle}</span>
                        <span className="admin-sub">{r.bookIdCode}</span>
                      </td>
                      <td>
                        <span>{r.realName}</span>
                        <span className="admin-sub">
                          &ldquo;{r.nickname}&rdquo;
                        </span>
                      </td>
                      <td className="admin-nowrap">
                        {shortDate(r.requestedAt)}
                      </td>
                      <td>
                        <span className={`status-badge ${pill.className}`}>
                          {pill.label}
                        </span>
                        {detail && <span className="admin-sub">{detail}</span>}
                      </td>
                      <td className="admin-nowrap">
                        <Collected r={r} />
                      </td>
                      <td>
                        <FlagPill flag={r.attentionFlag} />
                      </td>
                      <td>
                        <RequestRowActions request={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: one card per request (visual-system.md §8, §14.4) */}
          <ul className="admin-cards admin-phone-only">
            {requests.map((r) => {
              const pill = STATUS_PILL[r.status];
              const detail = statusDetail(r, ahead.get(r.id));
              return (
                <li key={r.id} className="admin-card">
                  <div className="admin-card-top">
                    <div>
                      <span className="admin-book-title">{r.bookTitle}</span>
                      <span className="admin-sub">{r.bookIdCode}</span>
                    </div>
                    <FlagPill flag={r.attentionFlag} />
                  </div>
                  <dl className="admin-card-facts">
                    <dt>Borrower</dt>
                    <dd>
                      {r.realName}{" "}
                      <span className="admin-muted">
                        &ldquo;{r.nickname}&rdquo;
                      </span>
                    </dd>
                    <dt>Requested</dt>
                    <dd>{shortDate(r.requestedAt)}</dd>
                    <dt>Status</dt>
                    <dd>
                      <span className={`status-badge ${pill.className}`}>
                        {pill.label}
                      </span>
                      {detail && <span className="admin-sub">{detail}</span>}
                    </dd>
                    <dt>Collected</dt>
                    <dd>
                      <Collected r={r} />
                    </dd>
                  </dl>
                  <RequestRowActions request={r} />
                </li>
              );
            })}
          </ul>

          <div className="admin-legend" aria-hidden="true">
            <span className="admin-filter-label">Flag colours</span>
            {Object.entries(FLAG_LABEL).map(([value, label]) => (
              <span key={value} className={`flag-pill flag-${value}`}>
                {label}
              </span>
            ))}
          </div>
        </>
      )}
      <AdminFooter />
    </main>
  );
}
