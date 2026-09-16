import { AdminHeader } from "@/app/admin/admin-header";
import { SyncForm } from "./sync-form";

export default function AdminSyncPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <AdminHeader />
      <h1 className="page-heading mb-6">Sync spreadsheet</h1>
      <SyncForm />
    </main>
  );
}
