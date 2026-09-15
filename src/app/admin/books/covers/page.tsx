import { CoversForm } from "./covers-form";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied here (Phase 6 of the build).
export default function AdminCoversPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl mb-6">Covers</h1>
      <CoversForm />
    </main>
  );
}