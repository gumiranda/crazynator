'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import UserControl from '@/components/user-control';

export default function Navbar() {
  return (
    <nav className="p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent">
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Crazy Code" width={24} height={24} />
          <span className="text-lg font-semibold">Crazy Code</span>
        </Link>
        <SignedOut>
          <div className="flex gap-2">
            <SignUpButton>
              <Button size="sm" variant="outline">
                Sign up
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserControl />
        </SignedIn>
      </div>
    </nav>
  );
}
