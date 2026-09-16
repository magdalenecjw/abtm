import { AdminHeader } from "../admin-header";
import { getAllRequestsForAdmin } from "./actions";
import { filterRequests } from "@/lib/borrowing/filter-requests";
import { parseRequestFilters } from "@/lib/borrowing/parse-filters";
import { RequestRowActions } from "./request-row-actions";

const FLAG_LABEL: Record<string, string> = {
  not_yet_collected: "Not yet collected",
  needs_attention: "Needs attention",
  long_loan: "Long loan",
  very_long_loan: "Very long loan",
};

// This is the listing + filters half of the dashboard
// (workflows.md §5.1-5.2).
export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseRequestFilters(sp);
  const allRequests = await getAllRequestsForAdmin();
  const requests = filterRequests(allRequests, filters);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 md:px-8">
      <AdminHeader />
      <h1 className="page-heading mb-6">Requests</h1>

      <form method="get" className="mb-6 flex flex-col gap-3">
        <input type="hidden" name="submitted" value="1" />

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="pending"
              value="1"
              defaultChecked={filters.showPending}
            />
            Pending
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="approved"
              value="1"
              defaultChecked={filters.showApproved}
            />
            Approved
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="history"
              value="1"
              defaultChecked={filters.showHistory}
            />
            Show history
          </label>
        </div>

        <div className="flex gap-4 text-sm">
          {Object.entries(FLAG_LABEL).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1">
              <input
                type="checkbox"
                name="flags"
                value={value}
                defaultChecked={filters.flags.includes(
                  value as (typeof filters.flags)[number],
                )}
              />
              {label}
            </label>
          ))}
        </div>

        <div>
          <label htmlFor="q" className="text-sm block mb-1">
            Search by title
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={filters.titleSearch}
            className="search-input"
          />
        </div>

        <button type="submit" className="secondary-button self-start">
          Apply filters
        </button>
      </form>

      {requests.length === 0 ? (
        <p>No requests match these filters.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--rule)] text-left">
              <th className="p-2">Book</th>
              <th className="p-2">Requester</th>
              <th className="p-2">Nickname</th>
              <th className="p-2">Requested</th>
              <th className="p-2">Status</th>
              <th className="p-2">Flag</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-[var(--rule)]">
                <td className="p-2">
                  {r.bookTitle} ({r.bookIdCode})
                </td>
                <td className="p-2">{r.realName}</td>
                <td className="p-2">{r.nickname}</td>
                <td className="p-2">
                  {new Date(r.requestedAt).toLocaleDateString()}
                </td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">
                  {r.attentionFlag ? FLAG_LABEL[r.attentionFlag] : ""}
                </td>
                <td className="p-2">
                  <RequestRowActions request={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
