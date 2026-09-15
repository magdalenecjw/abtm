import { SyncForm } from "./sync-form";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied anywhere in the app (Phase 6 of the build).
export default function AdminSyncPage() {
  return (
    <main>
      <h1>Sync spreadsheet</h1>
      <SyncForm />
    </main>
  );
}