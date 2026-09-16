import { AdminHeader } from "@/app/admin/admin-header";
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
      <main className="max-w-3xl mx-auto px-6 py-12">
        <AdminHeader />
        <p>This read could not be found.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <AdminHeader />
      <h1 className="page-heading mb-6">Edit read</h1>
      <EditReadForm read={read} />
    </main>
  );
}
