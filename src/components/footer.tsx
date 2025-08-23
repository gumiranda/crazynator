'use client';

import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-lg">CrazyNator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered code generation platform. 
              Transform ideas into functional web applications.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60">Documentation (Coming soon)</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="text-muted-foreground/60">Help Center (Coming soon)</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">System Status (Coming soon)</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">Contact (Coming soon)</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">API (Coming soon)</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p>© {currentYear} CrazyNator. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <span>🇧🇷</span>
              <span>Developed in Brazil</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">LGPD Compliant</span>
            </div>
          </div>
        </div>

        {/* LGPD Compliance Notice */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>LGPD - General Data Protection Law:</strong> This platform complies 
              with Law No. 13.709/2018 (LGPD). Your personal data is processed with security and transparency.
            </p>
            <p>
              <strong>Your Rights:</strong> You can access, correct, delete or request portability 
              of your data at any time through your account settings or by contacting us.
            </p>
            <p>
              <strong>DPO:</strong> For data protection related questions, contact 
              our Data Protection Officer through the support channels.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}