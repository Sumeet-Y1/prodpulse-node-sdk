'use strict';

/**
 * ProdPulse Git Context
 * Captures git information to identify which commit caused the error
 * This is the feature that makes ProdPulse better than Sentry
 */

const { execSync } = require('child_process');

function runGitCommand(command) {
  try {
    return execSync(command, {
      timeout: 2000, // 2 second timeout
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString().trim();
  } catch {
    return null;
  }
}

function getGitContext() {
  try {
    // Check if git is available and we're in a git repo
    const isGitRepo = runGitCommand('git rev-parse --is-inside-work-tree');
    if (!isGitRepo) return null;

    const commit = runGitCommand('git rev-parse HEAD');
    const shortCommit = runGitCommand('git rev-parse --short HEAD');
    const branch = runGitCommand('git rev-parse --abbrev-ref HEAD');
    const commitMessage = runGitCommand('git log -1 --pretty=%B');
    const commitAuthor = runGitCommand('git log -1 --pretty=%an');
    const commitEmail = runGitCommand('git log -1 --pretty=%ae');
    const commitTime = runGitCommand('git log -1 --pretty=%ci');
    const repoUrl = runGitCommand('git config --get remote.origin.url');
    const isDirty = runGitCommand('git status --porcelain') !== '';
    const lastTag = runGitCommand('git describe --tags --abbrev=0 2>/dev/null');

    return {
      commit,
      shortCommit,
      branch,
      commitMessage: commitMessage?.substring(0, 200),
      commitAuthor,
      // Sanitize email
      commitEmail: commitEmail ? '[EMAIL_REDACTED]' : null,
      commitTime,
      // Sanitize repo URL (remove credentials if any)
      repoUrl: repoUrl ? repoUrl.replace(/\/\/[^@]+@/, '//') : null,
      isDirty, // true if there are uncommitted changes
      lastTag,
    };
  } catch {
    return null;
  }
}

// Cache git context since it won't change during runtime
let cachedGitContext = null;
let gitContextFetched = false;

function getCachedGitContext() {
  if (!gitContextFetched) {
    cachedGitContext = getGitContext();
    gitContextFetched = true;
  }
  return cachedGitContext;
}

module.exports = { getGitContext: getCachedGitContext };