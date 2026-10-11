import Link from "next/link";
import Image from "next/image";
import { HelpButton } from "./help-button";

// Public header, per visual-system.md §9.1 / ui-specification.md §1.1:
// logo icon only on the left — the library's name appears once, in the
// catalogue hero, rather than being repeated here. (Admin, login and
// the request page keep using AppBrand, which still shows the name.)
export function SiteHeader() {
  return (
    <header className="mb-10 flex items-center gap-6 pb-4 border-b border-[var(--rule)] text-sm">
      <Link
        href="/"
        aria-label="(automated) book teller machine — home"
        className="mr-auto inline-flex"
      >
        <Image
          src="/logo-icon.png"
          alt=""
          width={36}
          height={36}
          priority
          className="rounded-[3px]"
        />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-6">
        <Link href="/" className="text-link">
          Catalogue
        </Link>
        <Link href="/reads" className="text-link">
          My Reads
        </Link>
        <Link href="/admin" className="text-link opacity-60 text-xs">
          Admin
        </Link>
        <HelpButton />
      </nav>
    </header>
  );
}
