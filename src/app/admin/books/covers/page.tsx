import { AdminFooter, AdminHeader } from "@/app/admin/admin-header";
import { AdminPageHeading } from "@/app/admin/admin-page-heading";
import { CoversForm } from "./covers-form";

export default function AdminCoversPage() {
  return (
    <main className="admin-page">
      <AdminHeader current="covers" />
      <AdminPageHeading eyebrow="Catalogue" title="Covers" />
      <CoversForm />
      <AdminFooter />
    </main>
  );
}
