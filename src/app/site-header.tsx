import Link from "next/link";
import Image from "next/image";
import { HelpButton } from "./help-button";

type PublicPage = "catalogue" | "reads";

const NAV: { page: PublicPage; href: string; label: string }[] = [
  { page: "catalogue", href: "/", label: "Catalogue" },
  { page: "reads", href: "/reads", label: "My Reads" },
];

// Public header, per visual-system.md §9.1 / ui-specification.md §1.1:
// logo on the left (the library's name appears once, in each page's
// hero), then the nav in the label style with the current page as a
// filled pill, the "?" help icon, and a small Admin link. A double rule
// sits underneath. (Admin, login and the request page keep using
// AppBrand, which still shows the name.)
//
// `current` is passed by each page rather than read from the URL, so
// this stays a Server Component.
export function SiteHeader({ current }: { current: PublicPage }) {
  return (
    <header className="site-header">
      <Link
        href="/"
        aria-label="(automated) book teller machine — home"
        className="site-logo"
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
      <nav aria-label="Main" className="site-nav">
        {NAV.map(({ page, href, label }) => (
          <Link
            key={page}
            href={href}
            className="site-nav-link"
            aria-current={page === current ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <HelpButton />
      <span className="site-admin">
        <Link href="/admin" className="site-admin-link">
          Admin
        </Link>
      </span>
    </header>
  );
}
