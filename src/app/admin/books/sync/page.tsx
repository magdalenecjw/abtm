import { AdminHeader } from "@/app/admin/admin-header";
import { AdminPageHeading } from "@/app/admin/admin-page-heading";
import { SyncForm } from "./sync-form";

export default function AdminSyncPage() {
  return (
    <main className="admin-page">
      <AdminHeader current="sync" />
      <AdminPageHeading eyebrow="Catalogue" title="Sync spreadsheet" />
      <SyncForm />
    </main>
  );
}
