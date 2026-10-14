import { AppBrand } from "@/app/app-brand";
import { LoginForm } from "./login-form";

// The login page has no menu, so it keeps the simple layout with the
// logo and library name (visual-system.md §14.1), restyled to match
// the back office.
export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <AppBrand />
      <div className="admin-login-card">
        <p className="admin-eyebrow">Back office</p>
        <h1 className="admin-title admin-title-small">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
