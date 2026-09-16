import { AdminHeader } from "@/app/admin/admin-header";
import { CoversForm } from "./covers-form";

export default function AdminCoversPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <AdminHeader />
      <h1 className="page-heading mb-6">Covers</h1>
      <CoversForm />
    </main>
  );
}
