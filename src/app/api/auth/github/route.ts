import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGitHubAuthUrl } from '@/lib/github';
import crypto from 'crypto';

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate a random state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session/cookie for verification (in production, use secure session storage)
    const response = NextResponse.redirect(getGitHubAuthUrl(state));
    
    // Set secure, httpOnly cookie with the state
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    // Also store the user ID to associate with the callback
    response.cookies.set('github_oauth_user', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('GitHub OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}