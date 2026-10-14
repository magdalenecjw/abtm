import { AdminHeader } from "@/app/admin/admin-header";
import { AdminPageHeading } from "@/app/admin/admin-page-heading";
import { getReadById } from "../../actions";
import { EditReadForm } from "./edit-read-form";

// `params` is a Promise in Next.js 16 (confirmed against the
// installed version's own docs).
export default async function EditReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const read = await getReadById(id);

  if (!read) {
    return (
      <main className="admin-page">
        <AdminHeader current="reads" />
        <p>This read could not be found.</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AdminHeader current="reads" />
      <AdminPageHeading eyebrow="My Reads" title="Edit read" />
      <EditReadForm read={read} />
    </main>
  );
}
