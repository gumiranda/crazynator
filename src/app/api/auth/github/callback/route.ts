import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForToken, getAuthenticatedUser, encryptToken } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Handle OAuth errors
  if (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?github_error=' + encodeURIComponent(error), request.url)
    );
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?github_error=missing_parameters', request.url)
    );
  }
  
  try {
    // Get state and user from cookies
    const storedState = request.cookies.get('github_oauth_state')?.value;
    const userId = request.cookies.get('github_oauth_user')?.value;
    
    if (!storedState || !userId) {
      return NextResponse.redirect(
        new URL('/dashboard?github_error=invalid_session', request.url)
      );
    }
    
    // Verify state parameter
    if (state !== storedState) {
      return NextResponse.redirect(
        new URL('/dashboard?github_error=invalid_state', request.url)
      );
    }
    
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    
    // Get user information from GitHub
    const githubUser = await getAuthenticatedUser(tokenResponse.access_token);
    
    // Encrypt the access token for secure storage
    const encryptedToken = encryptToken(tokenResponse.access_token);
    
    // Store or update GitHub connection
    await prisma.gitHubConnection.upsert({
      where: { userId },
      create: {
        userId,
        githubUserId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        accessToken: encryptedToken,
        scope: tokenResponse.scope,
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
      },
      update: {
        githubUserId: githubUser.id.toString(),
        githubUsername: githubUser.login,
        accessToken: encryptedToken,
        scope: tokenResponse.scope,
        avatarUrl: githubUser.avatar_url,
        profileUrl: githubUser.html_url,
        updatedAt: new Date(),
      },
    });
    
    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL('/dashboard?github_success=connected', request.url)
    );
    
    response.cookies.delete('github_oauth_state');
    response.cookies.delete('github_oauth_user');
    
    return response;
    
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?github_error=callback_failed', request.url)
    );
  }
}