import { logout } from "./actions";

// PLACEHOLDER. The real dashboard (eight stat boxes, per
// ui-specification.md §2.2) is built in a later step. This page exists
// right now only so proxy.ts (Step 3) has a real destination to redirect
// a freshly-logged-in admin to, so the auth round-trip is testable
// end-to-end before the rest of Phase 2 is built.
export default function AdminDashboardPage() {
  return (
    <main>
      <h1>Admin dashboard (placeholder)</h1>
      <p>If you can see this page, admin login is working.</p>
      <form action={logout}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}