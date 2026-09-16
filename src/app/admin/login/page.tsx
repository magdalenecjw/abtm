import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="max-w-sm mx-auto px-6 py-20">
      <h1 className="page-heading mb-6">Admin login</h1>
      <LoginForm />
    </main>
  );
}