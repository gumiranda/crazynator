import { Octokit } from '@octokit/rest';
import { OAuthApp } from '@octokit/oauth-app';
import crypto from 'crypto';

// Encryption key for storing GitHub tokens securely
const ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface CreateRepositoryData {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}

/**
 * Encrypt a GitHub access token for secure storage
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(12); // 12 bytes for GCM
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a GitHub access token
 */
export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Create an OAuth app instance for GitHub authentication
 */
export function createGitHubOAuthApp() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  return new OAuthApp({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  });
}

/**
 * Create a GitHub API client with an access token
 */
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();
  
  return {
    id: data.id,
    login: data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

/**
 * Create a new repository on GitHub
 */
export async function createRepository(
  accessToken: string,
  repositoryData: CreateRepositoryData
): Promise<GitHubRepository> {
  const octokit = createGitHubClient(accessToken);
  
  const { data } = await octokit.rest.repos.createForAuthenticatedUser({
    name: repositoryData.name,
    description: repositoryData.description,
    private: repositoryData.private || false,
    auto_init: repositoryData.auto_init || true,
  });
  
  return {
    id: data.id,
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    private: data.private,
    html_url: data.html_url,
    clone_url: data.clone_url,
    default_branch: data.default_branch,
  };
}

/**
 * Get repository information
 */
export async function getRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepository> {
  const octokit = createGitHubClient(accessToken);
  
  const { data } = await octokit.rest.repos.get({
    owner,
    repo,
  });
  
  return {
    id: data.id,
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    private: data.private,
    html_url: data.html_url,
    clone_url: data.clone_url,
    default_branch: data.default_branch,
  };
}

/**
 * Create or update a file in a GitHub repository
 */
export async function createOrUpdateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main'
): Promise<void> {
  const octokit = createGitHubClient(accessToken);
  
  try {
    // Try to get existing file to get its SHA
    const { data: existingFile } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    
    if ('sha' in existingFile) {
      // File exists, update it
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha: existingFile.sha,
        branch,
      });
    }
  } catch (error: any) {
    if (error.status === 404) {
      // File doesn't exist, create it
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Create multiple files in a GitHub repository using a single commit
 */
export async function createMultipleFiles(
  accessToken: string,
  owner: string,
  repo: string,
  files: Record<string, string>,
  commitMessage: string,
  branch: string = 'main'
): Promise<void> {
  const octokit = createGitHubClient(accessToken);
  
  // Get the current commit SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  
  const currentCommitSha = ref.object.sha;
  
  // Get the current tree
  const { data: currentCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: currentCommitSha,
  });
  
  const currentTreeSha = currentCommit.tree.sha;
  
  // Create blobs for each file
  const tree = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content, 'utf8').toString('base64'),
        encoding: 'base64',
      });
      
      return {
        path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      };
    })
  );
  
  // Create new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: currentTreeSha,
    tree,
  });
  
  // Create new commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [currentCommitSha],
  });
  
  // Update the branch reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });
}

/**
 * Generate GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(state: string): string {
  const baseUrl = 'https://github.com/login/oauth/authorize';
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: 'repo user:email',
    state,
    allow_signup: 'true',
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }
  
  return data;
}