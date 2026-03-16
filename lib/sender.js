'use strict';

const axios = require('axios');

const DEFAULT_API_URL = 'https://prodpulse-ai-1-t6n5.onrender.com/api/logs/ingest';

async function sendLog(apiKey, logData) {
  if (!apiKey) {
    console.warn('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
    return;
  }

  try {
    await axios.post(
      DEFAULT_API_URL,
      { logs: logData },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
  } catch (err) {
    // Silently fail — never crash the user's app because of our SDK
    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Failed to send log:', err.message);
    }
  }
}

module.exports = { sendLog };