'use strict';

const { sendLog } = require('./sender');

function initHttpMonitor(apiKey) {
  try {
    const http = require('http');
    const https = require('https');

    [http, https].forEach((module) => {
      const originalRequest = module.request.bind(module);

      module.request = (options, callback) => {
        const start = Date.now();
        const req = originalRequest(options, callback);

        req.on('error', (err) => {
          const url = typeof options === 'string'
            ? options
            : `${options.hostname || options.host}${options.path || ''}`;

          sendLog(apiKey, `
HTTP REQUEST ERROR
URL: ${url}
Method: ${options.method || 'GET'}
Error: ${err.message}
Stack: ${err.stack}
Timestamp: ${new Date().toISOString()}
          `.trim());
        });

        req.on('response', (res) => {
          const duration = Date.now() - start;
          const url = typeof options === 'string'
            ? options
            : `${options.hostname || options.host}${options.path || ''}`;

          // Detect slow HTTP calls (over 5 seconds)
          if (duration > 5000) {
            sendLog(apiKey, `
SLOW HTTP REQUEST
URL: ${url}
Method: ${options.method || 'GET'}
Duration: ${duration}ms
Status: ${res.statusCode}
Timestamp: ${new Date().toISOString()}
            `.trim());
          }

          // Detect 5xx errors
          if (res.statusCode >= 500) {
            sendLog(apiKey, `
HTTP 5XX ERROR
URL: ${url}
Method: ${options.method || 'GET'}
Status: ${res.statusCode}
Duration: ${duration}ms
Timestamp: ${new Date().toISOString()}
            `.trim());
          }
        });

        return req;
      };
    });

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.log('[ProdPulse] HTTP monitor initialized ✓');
    }
  } catch (err) {
    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Failed to initialize HTTP monitor:', err.message);
    }
  }
}

module.exports = { initHttpMonitor };