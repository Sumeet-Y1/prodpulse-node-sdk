'use strict';

/**
 * ProdPulse Deduplication
 * Prevents sending the same error multiple times
 * Saves token usage and reduces noise
 */

const DEFAULT_WINDOW = 60 * 60 * 1000; // 1 hour in ms
const DEFAULT_MAX_CACHE = 1000; // max errors to track

class DedupeCache {
  constructor(windowMs = DEFAULT_WINDOW, maxCache = DEFAULT_MAX_CACHE) {
    this.windowMs = windowMs;
    this.maxCache = maxCache;
    this.cache = new Map();
  }

  /**
   * Generate a fingerprint for an error
   * Same error type + same location = same fingerprint
   */
  generateFingerprint(error) {
    try {
      // Extract key info from error
      const type = error.name || 'UnknownError';
      const message = error.message || '';

      // Get first meaningful stack frame
      const stackLines = (error.stack || '').split('\n');
      const firstFrame = stackLines
        .find(line => line.includes('at ') && !line.includes('node_modules'))
        || stackLines[1]
        || '';

      // Create fingerprint from type + message + location
      const fingerprint = `${type}:${message}:${firstFrame}`.substring(0, 200);

      return fingerprint;
    } catch {
      return String(error).substring(0, 200);
    }
  }

  /**
   * Check if error should be sent or deduplicated
   * Returns true if should send, false if duplicate
   */
  shouldSend(error) {
    const fingerprint = this.generateFingerprint(error);
    const now = Date.now();

    // Check if we've seen this error recently
    if (this.cache.has(fingerprint)) {
      const entry = this.cache.get(fingerprint);

      // Check if within dedup window
      if (now - entry.firstSeen < this.windowMs) {
        // Update count
        entry.count++;
        entry.lastSeen = now;
        this.cache.set(fingerprint, entry);

        if (process.env.PRODPULSE_DEBUG === 'true') {
          console.log(`[ProdPulse] Deduplicated error (${entry.count}x): ${fingerprint.substring(0, 50)}`);
        }

        return false; // don't send duplicate
      }
    }

    // New error or window expired — add to cache
    // Clean cache if too large
    if (this.cache.size >= this.maxCache) {
      this.cleanup();
    }

    this.cache.set(fingerprint, {
      firstSeen: now,
      lastSeen: now,
      count: 1,
      fingerprint,
    });

    return true; // send this error
  }

  /**
   * Get stats for a specific error
   */
  getStats(error) {
    const fingerprint = this.generateFingerprint(error);
    return this.cache.get(fingerprint) || null;
  }

  /**
   * Clean expired entries from cache
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.firstSeen > this.windowMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instance
const defaultCache = new DedupeCache();

module.exports = {
  DedupeCache,
  defaultCache,
  shouldSend: (error) => defaultCache.shouldSend(error),
  getStats: (error) => defaultCache.getStats(error),
};