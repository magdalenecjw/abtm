import { AdminHeader } from "@/app/admin/admin-header";
import { AdminPageHeading } from "@/app/admin/admin-page-heading";
import { GoodreadsImportForm } from "./goodreads-import-form";

export default function GoodreadsImportPage() {
  return (
    <main className="admin-page">
      <AdminHeader current="import" />
      <AdminPageHeading eyebrow="My Reads" title="Import from Goodreads" />
      <GoodreadsImportForm />
    </main>
  );
}
