import Link from "next/link";
import Image from "next/image";
import { HelpButton } from "./help-button";

export function SiteHeader() {
  return (
    <header className="mb-10">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo-icon.png"
          alt=""
          width={36}
          height={36}
          className="rounded-[3px]"
        />
        <span className="font-caslon text-xl">
          (automated) book teller machine
        </span>
      </Link>
      <nav className="flex items-center gap-6 text-sm mt-4 pt-4 border-t border-[var(--rule)]">
        <Link href="/" className="text-link">
          Catalogue
        </Link>
        <Link href="/reads" className="text-link">
          My Reads
        </Link>
        <HelpButton />
        <Link href="/admin" className="text-link ml-auto opacity-60 text-xs">
          Admin
        </Link>
      </nav>
    </header>
  );
}