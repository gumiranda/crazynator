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
    const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
    const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
      ? redirectUrl + '?github_error=' + encodeURIComponent(error)
      : redirectUrl + '?github_error=' + encodeURIComponent(error);
    return NextResponse.redirect(
      new URL(finalRedirectUrl, request.url)
    );
  }
  
  if (!code || !state) {
    const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
    const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
      ? redirectUrl + '?github_error=missing_parameters'
      : redirectUrl + '?github_error=missing_parameters';
    return NextResponse.redirect(
      new URL(finalRedirectUrl, request.url)
    );
  }
  
  try {
    // Get state, user, and redirect URL from cookies
    const storedState = request.cookies.get('github_oauth_state')?.value;
    const userId = request.cookies.get('github_oauth_user')?.value;
    const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
    
    if (!storedState || !userId) {
      const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
        ? redirectUrl + '?github_error=invalid_session'
        : redirectUrl + '?github_error=invalid_session';
      return NextResponse.redirect(
        new URL(finalRedirectUrl, request.url)
      );
    }
    
    // Verify state parameter
    if (state !== storedState) {
      const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
        ? redirectUrl + '?github_error=invalid_state'
        : redirectUrl + '?github_error=invalid_state';
      return NextResponse.redirect(
        new URL(finalRedirectUrl, request.url)
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
    const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
      ? redirectUrl + '?github_success=connected'
      : redirectUrl + '?github_success=connected';
    
    const response = NextResponse.redirect(
      new URL(finalRedirectUrl, request.url)
    );
    
    response.cookies.delete('github_oauth_state');
    response.cookies.delete('github_oauth_user');
    response.cookies.delete('github_oauth_redirect');
    
    return response;
    
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
    const finalRedirectUrl = redirectUrl.includes('/auth/github/popup') 
      ? redirectUrl + '?github_error=callback_failed'
      : redirectUrl + '?github_error=callback_failed';
    return NextResponse.redirect(
      new URL(finalRedirectUrl, request.url)
    );
  }
}