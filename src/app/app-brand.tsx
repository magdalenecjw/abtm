import Link from "next/link";
import Image from "next/image";

export function AppBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 mb-4">
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
  );
}