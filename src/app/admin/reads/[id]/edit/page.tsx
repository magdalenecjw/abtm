import { getReadById } from "../../actions";
import { EditReadForm } from "./edit-read-form";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build). `params` is a
// Promise in Next.js 16 (confirmed against the installed version's
// own docs).
export default async function EditReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const read = await getReadById(id);

  if (!read) {
    return (
      <main className="p-8">
        <p>This read could not be found.</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">Edit read</h1>
      <EditReadForm read={read} />
    </main>
  );
}