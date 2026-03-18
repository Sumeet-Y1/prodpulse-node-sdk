'use strict';

/**
 * ProdPulse Offline Queue
 * Stores failed logs and retries when connection restored
 * Never loses an error even if ProdPulse is temporarily down
 */

const DEFAULT_MAX_QUEUE = 100;
const DEFAULT_RETRY_INTERVAL = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 5;

class OfflineQueue {
  constructor(options = {}) {
    this.maxQueue = options.maxQueue || DEFAULT_MAX_QUEUE;
    this.retryInterval = options.retryInterval || DEFAULT_RETRY_INTERVAL;
    this.maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
    this.queue = [];
    this.isProcessing = false;
    this.retryTimer = null;
    this.sendFn = null; // will be set by sender
  }

  /**
   * Set the send function to use for retries
   */
  setSendFunction(fn) {
    this.sendFn = fn;
  }

  /**
   * Add a failed log to the queue
   */
  enqueue(apiKey, logData) {
    if (this.queue.length >= this.maxQueue) {
      // Remove oldest entry if queue is full
      this.queue.shift();
      if (process.env.PRODPULSE_DEBUG === 'true') {
        console.warn('[ProdPulse] Queue full, dropping oldest entry');
      }
    }

    this.queue.push({
      apiKey,
      logData,
      attempts: 0,
      enqueuedAt: Date.now(),
    });

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.log(`[ProdPulse] Added to offline queue. Queue size: ${this.queue.length}`);
    }

    // Start retry timer if not already running
    this.startRetryTimer();
  }

  /**
   * Start the retry timer
   */
  startRetryTimer() {
    if (this.retryTimer) return;

    this.retryTimer = setInterval(() => {
      this.processQueue();
    }, this.retryInterval);

    // Don't keep Node.js alive just for retries
    if (this.retryTimer.unref) {
      this.retryTimer.unref();
    }
  }

  /**
   * Stop the retry timer
   */
  stopRetryTimer() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Process all queued logs
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.sendFn) return;

    this.isProcessing = true;

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.log(`[ProdPulse] Processing offline queue: ${this.queue.length} items`);
    }

    const toRetry = [...this.queue];
    this.queue = [];

    for (const item of toRetry) {
      try {
        await this.sendFn(item.apiKey, item.logData);

        if (process.env.PRODPULSE_DEBUG === 'true') {
          console.log('[ProdPulse] Successfully sent queued log');
        }
      } catch (err) {
        item.attempts++;

        if (item.attempts < this.maxRetries) {
          // Put back in queue for retry
          this.queue.push(item);
        } else {
          if (process.env.PRODPULSE_DEBUG === 'true') {
            console.error(`[ProdPulse] Dropping log after ${this.maxRetries} failed attempts`);
          }
        }
      }
    }

    // Stop timer if queue is empty
    if (this.queue.length === 0) {
      this.stopRetryTimer();
    }

    this.isProcessing = false;
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    this.stopRetryTimer();
  }
}

// Export singleton
const defaultQueue = new OfflineQueue();

module.exports = {
  OfflineQueue,
  defaultQueue,
  enqueue: (apiKey, logData) => defaultQueue.enqueue(apiKey, logData),
};