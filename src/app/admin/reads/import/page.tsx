import { AdminHeader } from "@/app/admin/admin-header";
import { GoodreadsImportForm } from "./goodreads-import-form";

export default function GoodreadsImportPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <AdminHeader />
      <h1 className="page-heading mb-6">Import from Goodreads</h1>
      <GoodreadsImportForm />
    </main>
  );
}
