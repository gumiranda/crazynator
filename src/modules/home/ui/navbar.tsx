'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import UserControl from '@/components/user-control';
import { useScroll } from '@/hooks/use-scroll';
import { cn } from '@/lib/utils';
import { BrandHeader } from '@/components/whitelabel/brand-header';
import { useFeatures } from '@/hooks/use-whitelabel';

export default function Navbar() {
  const isScrolled = useScroll();
  const features = useFeatures();
  
  return (
    <nav
      className={cn(
        'p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent',
        isScrolled && 'bg-background border-border',
      )}
    >
      <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link href="/">
          <BrandHeader logoSize={24} />
        </Link>
        <SignedOut>
          <div className="flex gap-2">
            {features.signUp && (
              <SignUpButton>
                <Button size="sm" variant="outline">
                  Sign up
                </Button>
              </SignUpButton>
            )}
            {features.signIn && (
              <SignInButton>
                <Button size="sm">Sign in</Button>
              </SignInButton>
            )}
          </div>
        </SignedOut>
        <SignedIn>
          <UserControl />
        </SignedIn>
      </div>
    </nav>
  );
}
