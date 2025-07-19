import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/register(.*)',
  '/',
  '/api/inngest(.*)',
  '/api/trpc(.*)',
  '/pricing(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Handle Supabase auth for routes that start with /supabase
  if (req.nextUrl.pathname.startsWith('/supabase')) {
    return await updateSession(req);
  }

  // Handle Clerk auth for other protected routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
