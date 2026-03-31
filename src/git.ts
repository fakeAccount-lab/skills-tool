import simpleGit from 'simple-git';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

const CLONE_TIMEOUT_MS = 60000; // 60 seconds

export class GitCloneError extends Error {
  readonly url: string;
  readonly isTimeout: boolean;
  readonly isAuthError: boolean;

  constructor(message: string, url: string, isTimeout = false, isAuthError = false) {
    super(message);
    this.name = 'GitCloneError';
    this.url = url;
    this.isTimeout = isTimeout;
    this.isAuthError = isAuthError;
  }
}

/**
 * Normalize git URL to standard format
 * Supports:
 * - GitHub shorthand: owner/repo
 * - Full HTTPS URL: https://github.com/owner/repo
 * - SSH URL: git@github.com:owner/repo.git
 * - With branch: owner/repo#branch
 */
export function normalizeGitUrl(url: string, ref?: string): { url: string; ref?: string } {
  // Check if ref is already specified with # syntax
  const parts = url.split('#');
  const mainUrl = parts[0];
  const urlRef = parts[1] || ref;

  // GitHub shorthand: owner/repo
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(mainUrl)) {
    const normalizedUrl = `https://github.com/${mainUrl}.git`;
    return { url: normalizedUrl, ref: urlRef };
  }

  return { url: mainUrl, ref: urlRef };
}

export async function cloneRepo(url: string, ref?: string): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), 'skill-installer-'));
  
  // Set environment variable for git
  process.env.GIT_TERMINAL_PROMPT = '0';
  
  const git = simpleGit();

  const { url: normalizedUrl, ref: resolvedRef } = normalizeGitUrl(url, ref);
  
  const cloneOptions = resolvedRef 
    ? ['--depth', '1', '--branch', resolvedRef, '--single-branch'] 
    : ['--depth', '1'];

  try {
    // Use promises API for better timeout handling
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Clone timed out after ${CLONE_TIMEOUT_MS}ms`));
      }, CLONE_TIMEOUT_MS);

      git.clone(normalizedUrl, tempDir, cloneOptions)
        .then(() => {
          clearTimeout(timeoutId);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    return tempDir;
  } catch (error) {
    // Clean up temp dir on failure
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('block timeout') || errorMessage.includes('timed out');
    const isAuthError =
      errorMessage.includes('Authentication failed') ||
      errorMessage.includes('could not read Username') ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('Repository not found');

    if (isTimeout) {
      throw new GitCloneError(
        `Clone timed out after 60s. This often happens with private repos that require authentication.\n` +
          `  Ensure you have access and your SSH keys are configured:\n` +
          `  - For SSH: ssh -T git@github.com\n` +
          `  - For HTTPS: Check your git credentials`,
        normalizedUrl,
        true,
        false
      );
    }

    if (isAuthError) {
      throw new GitCloneError(
        `Authentication failed for ${normalizedUrl}.\n` +
          `  - For private repos, ensure you have access\n` +
          `  - For SSH: Check your keys with 'ssh -T git@github.com'\n` +
          `  - For HTTPS: Configure git credentials`,
        normalizedUrl,
        false,
        true
      );
    }

    throw new GitCloneError(`Failed to clone ${normalizedUrl}: ${errorMessage}`, normalizedUrl, false, false);
  }
}

export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
