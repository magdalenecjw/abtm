import Link from "next/link";
import { AppBrand } from "./app-brand";
import { HelpButton } from "./help-button";

export function SiteHeader() {
  return (
    <header className="mb-10">
      <AppBrand />
      <nav className="flex items-center gap-6 text-sm pt-4 border-t border-[var(--rule)]">
        <Link href="/" className="text-link">
          Catalogue
        </Link>
        <Link href="/reads" className="text-link">
          My Reads
        </Link>
        <Link href="/admin" className="text-link ml-auto opacity-60 text-xs">
          Admin
        </Link>
        <HelpButton />
      </nav>
    </header>
  );
}