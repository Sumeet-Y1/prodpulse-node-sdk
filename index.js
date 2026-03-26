'use strict';

const { sendLog } = require('./lib/sender');
const { initErrorHandler, captureError } = require('./lib/errorHandler');
const { monitorMySQL, monitorPostgres, monitorMongoDB } = require('./lib/dbMonitor');
const { initHttpMonitor } = require('./lib/httpMonitor');
const { createRequestMiddleware } = require('./lib/context/requestContext');
const { sanitizeString, sanitizeObject } = require('./lib/utils/sanitizer');
const { getGitContext } = require('./lib/context/gitContext');
const { getSystemContext } = require('./lib/context/systemContext');
const { getAppContext } = require('./lib/context/appContext');

let apiKey = null;
let initialized = false;
let config = {};

/**
 * Initialize ProdPulse SDK
 * @param {string} [key] - Your ProdPulse API key (optional if PRODPULSE_API_KEY env var is set)
 * @param {object} options - Optional configuration
 */
function init(key, options = {}) {
  // Support env variable if no key passed
  const resolvedKey = key || process.env.PRODPULSE_API_KEY;

  if (!resolvedKey) {
    throw new Error(
      '[ProdPulse] API key is required. Pass it to init() or set the PRODPULSE_API_KEY environment variable. Get yours at prodpulse.ai'
    );
  }

  if (!resolvedKey.startsWith('pp_live_') && !resolvedKey.startsWith('pp_test_')) {
    throw new Error('[ProdPulse] Invalid API key format. Must start with pp_live_ or pp_test_');
  }

  if (initialized) {
    console.warn('[ProdPulse] SDK already initialized.');
    return;
  }

  apiKey = resolvedKey;
  initialized = true;
  config = options;

  // Initialize error handler
  initErrorHandler(apiKey, {
    appName: options.appName,
    appVersion: options.appVersion,
    environment: options.environment,
    serviceName: options.serviceName,
  });

  // Initialize HTTP monitor
  if (options.monitorHttp !== false) {
    initHttpMonitor(apiKey);
  }

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║     ProdPulse.AI SDK Initialized     ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`Environment  : ${resolvedKey.startsWith('pp_live_') ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`API Key Source: ${key ? 'init() argument' : 'PRODPULSE_API_KEY env var'}`);
    console.log(`App Name     : ${options.appName || 'unknown'}`);
    console.log(`App Version  : ${options.appVersion || 'unknown'}`);
    console.log(`HTTP Monitor : ${options.monitorHttp !== false ? '✓' : '✗'}`);
    console.log(`Git Context  : ${getGitContext() ? '✓' : '✗'}`);
    console.log('');
  }
}

/**
 * Monitor database connections
 * @param {object} connection - DB connection or pool
 * @param {string} type - mysql | postgresql | mongodb | redis
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
      console.warn(`[ProdPulse] Unsupported DB type: ${type}. Supported: mysql, postgresql, mongodb`);
  }
}

/**
 * Manually capture an error with full context
 * @param {Error|string} error - Error object or string
 * @param {object} extra - Extra context
 */
function capture(error, extra = {}) {
  if (!initialized) {
    throw new Error('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
  }

  if (error instanceof Error) {
    captureError(apiKey, error, { extra: sanitizeObject(extra) });
  } else {
    const log = `
MANUAL CAPTURE
Message: ${sanitizeString(String(error))}
Extra: ${sanitizeString(JSON.stringify(extra))}
Timestamp: ${new Date().toISOString()}
    `.trim();
    sendLog(apiKey, log);
  }
}

/**
 * Express/Fastify request middleware
 * Attaches request context to errors automatically
 * Usage: app.use(prodpulse.requestMiddleware())
 */
function requestMiddleware() {
  if (!initialized) {
    throw new Error('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
  }
  return createRequestMiddleware();
}

/**
 * Express error handler middleware
 * Captures Express errors with full context
 * Usage: app.use(prodpulse.errorMiddleware())
 */
function errorMiddleware() {
  if (!initialized) {
    throw new Error('[ProdPulse] SDK not initialized. Call prodpulse.init() first.');
  }

  return (err, req, res, next) => {
    captureError(apiKey, err, {
      request: req._prodpulseContext || null,
      extra: { type: 'express_error_middleware' }
    });
    next(err);
  };
}

/**
 * Get current SDK context (for debugging)
 */
function getContext() {
  return {
    initialized,
    environment: apiKey?.startsWith('pp_live_') ? 'production' : 'development',
    git: getGitContext(),
    system: getSystemContext(),
    app: getAppContext(config),
  };
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
  requestMiddleware,
  errorMiddleware,
  getContext,
  isInitialized,
};