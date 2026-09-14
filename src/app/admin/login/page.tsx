import { LoginForm } from "./login-form";

// Visual treatment intentionally deferred — see docs/visual-system.md,
// which is not yet applied anywhere in the app (Phase 6 of the build).
export default function AdminLoginPage() {
  return (
    <main>
      <h1>Admin login</h1>
      <LoginForm />
    </main>
  );
}