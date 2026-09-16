import { AppBrand } from "@/app/app-brand";
import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <AppBrand />
      <h1 className="page-heading mb-6 mt-6">Admin login</h1>
      <LoginForm />
    </main>
  );
}