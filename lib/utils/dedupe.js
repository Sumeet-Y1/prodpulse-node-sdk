'use strict';

/**
 * ProdPulse Deduplication
 * Prevents sending the same error multiple times
 * Saves token usage and reduces noise
 */

const DEFAULT_WINDOW = 60 * 60 * 1000; // 1 hour in ms
const DEFAULT_MAX_CACHE = 1000; // max errors to track
const SHORT_LOCK_MS = 5000; // 5 second lock for simultaneous captures

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
      const type = error.name || 'UnknownError';
      const message = error.message || '';

      const stackLines = (error.stack || '').split('\n');
      const firstFrame = stackLines
        .find(line => line.includes('at ') && !line.includes('node_modules'))
        || stackLines[1]
        || '';

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

    if (this.cache.has(fingerprint)) {
      const entry = this.cache.get(fingerprint);

      // Short-term lock — block same error within 5 seconds
      // This prevents multiple handlers (uncaughtException, console.error, http monitor)
      // from all firing at the same time for the same error
      if (now - entry.lastSeen < SHORT_LOCK_MS) {
        entry.count++;
        entry.lastSeen = now;
        this.cache.set(fingerprint, entry);

        if (process.env.PRODPULSE_DEBUG === 'true') {
          console.log(`[ProdPulse] Short-lock deduplicated (${entry.count}x): ${fingerprint.substring(0, 50)}`);
        }

        return false;
      }

      // Long-term dedup window (1 hour)
      if (now - entry.firstSeen < this.windowMs) {
        entry.count++;
        entry.lastSeen = now;
        this.cache.set(fingerprint, entry);

        if (process.env.PRODPULSE_DEBUG === 'true') {
          console.log(`[ProdPulse] Deduplicated error (${entry.count}x): ${fingerprint.substring(0, 50)}`);
        }

        return false;
      }
    }

    // New error or window expired — add to cache
    if (this.cache.size >= this.maxCache) {
      this.cleanup();
    }

    this.cache.set(fingerprint, {
      firstSeen: now,
      lastSeen: now,
      count: 1,
      fingerprint,
    });

    return true;
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