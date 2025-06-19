
import Link from 'next/link';
import Image from 'next/image';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center" aria-label="Dutch Oriental Logo">
      <Image
        src="/dutch-oriental-logo.png" 
        alt="Dutch Oriental Logo"
        width={130}
        height={32}
        className="object-contain"
      />
    </Link>
  );
}
