'use strict';

const { sendLog } = require('./lib/sender');
const { initErrorHandler } = require('./lib/errorHandler');
const { monitorMySQL, monitorPostgres, monitorMongoDB } = require('./lib/dbMonitor');
const { initHttpMonitor } = require('./lib/httpMonitor');

let apiKey = null;
let initialized = false;

/**
 * Initialize ProdPulse SDK
 * @param {string} key - Your ProdPulse API key (pp_live_xxx or pp_test_xxx)
 * @param {object} options - Optional configuration
 */
function init(key, options = {}) {
  if (!key) {
    throw new Error('[ProdPulse] API key is required. Get yours at prodpulse.ai');
  }

  if (!key.startsWith('pp_live_') && !key.startsWith('pp_test_')) {
    throw new Error('[ProdPulse] Invalid API key format. Key must start with pp_live_ or pp_test_');
  }

  if (initialized) {
    console.warn('[ProdPulse] SDK already initialized.');
    return;
  }

  apiKey = key;
  initialized = true;

  // Initialize error handler by default
  initErrorHandler(apiKey);

  // Initialize HTTP monitor by default
  if (options.monitorHttp !== false) {
    initHttpMonitor(apiKey);
  }

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] SDK initialized successfully ✓');
    console.log('[ProdPulse] Environment:', key.startsWith('pp_live_') ? 'PRODUCTION' : 'DEVELOPMENT');
  }
}

/**
 * Monitor MySQL connection
 * @param {object} connection - MySQL connection or pool
 */
function monitorDatabase(connection, type = 'mysql') {
  if (!initialized) {
    throw new Error('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
  }

  switch (type.toLowerCase()) {
    case 'mysql':
      monitorMySQL(apiKey, connection);
      break;
    case 'postgresql':
    case 'postgres':
    case 'pg':
      monitorPostgres(apiKey, connection);
      break;
    case 'mongodb':
    case 'mongoose':
      monitorMongoDB(apiKey, connection);
      break;
    default:
      console.warn(`[ProdPulse] Unsupported database type: ${type}. Supported: mysql, postgresql, mongodb`);
  }
}

/**
 * Manually capture an error or log
 * @param {Error|string} error - Error object or string message
 * @param {object} extra - Extra context to include
 */
function capture(error, extra = {}) {
  if (!initialized) {
    throw new Error('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
  }

  let log;
  if (error instanceof Error) {
    log = `
MANUAL CAPTURE
Type: ${error.name}
Message: ${error.message}
Stack: ${error.stack}
Extra: ${JSON.stringify(extra)}
Timestamp: ${new Date().toISOString()}
    `.trim();
  } else {
    log = `
MANUAL CAPTURE
Message: ${String(error)}
Extra: ${JSON.stringify(extra)}
Timestamp: ${new Date().toISOString()}
    `.trim();
  }

  sendLog(apiKey, log);
}

/**
 * Check if SDK is initialized
 */
function isInitialized() {
  return initialized;
}

module.exports = {
  init,
  monitorDatabase,
  capture,
  isInitialized
};