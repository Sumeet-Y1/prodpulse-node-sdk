'use strict';

const axios = require('axios');
const https = require('https');
const { sanitizeString } = require('./utils/sanitizer');
const { defaultQueue } = require('./utils/queue');

const DEFAULT_API_URL = 'https://prodpulse-ai-1-t6n5.onrender.com/api/logs/ingest';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// HTTPS agent enforcing TLS 1.2+
const httpsAgent = new https.Agent({
  minVersion: 'TLSv1.2',
});

/**
 * Core send function with retry logic
 */
async function sendLogWithRetry(apiKey, payload, retryCount = 0) {
  try {
    await axios.post(
      DEFAULT_API_URL,
      payload,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
          'X-SDK-Version': '2.0.0',
          'X-SDK-Name': 'prodpulse-node-sdk',
        },
        timeout: 10000,
        httpsAgent,
      }
    );

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.log('[ProdPulse] ✅ Log sent successfully');
    }

    return true;

  } catch (err) {
    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.warn(`[ProdPulse] Send failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${err.message}`);
    }

    // Retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount))
      );
      return sendLogWithRetry(apiKey, payload, retryCount + 1);
    }

    // All retries failed — add to offline queue
    defaultQueue.enqueue(apiKey, payload);

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.warn('[ProdPulse] Added to offline queue for later retry');
    }

    return false;
  }
}

/**
 * Main send function
 * Sanitizes log and sends to ProdPulse API
 * Non-blocking — never slows down your app
 */
function sendLog(apiKey, logData, context = {}) {
  if (!apiKey) {
    console.warn('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
    return;
  }

  // Sanitize log before sending
  const sanitizedLog = sanitizeString(
    typeof logData === 'string' ? logData : JSON.stringify(logData)
  );

  // Build payload with context
  const payload = {
    logs: sanitizedLog,
    context: {
      ...context,
      sdkVersion: '2.0.0',
      sentAt: new Date().toISOString(),
    },
  };

  // Non-blocking send — never slow down main app
  setImmediate(() => sendLogWithRetry(apiKey, payload));
}

/**
 * Direct send function (blocking — for testing)
 */
async function sendLogDirect(apiKey, logData, context = {}) {
  const sanitizedLog = sanitizeString(
    typeof logData === 'string' ? logData : JSON.stringify(logData)
  );

  const payload = {
    logs: sanitizedLog,
    context: {
      ...context,
      sdkVersion: '2.0.0',
      sentAt: new Date().toISOString(),
    },
  };

  return sendLogWithRetry(apiKey, payload);
}

// Set queue's send function for retries
defaultQueue.setSendFunction((apiKey, payload) =>
  sendLogWithRetry(apiKey, payload)
);

module.exports = { sendLog, sendLogDirect };