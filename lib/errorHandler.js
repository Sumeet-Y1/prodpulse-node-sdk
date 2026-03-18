'use strict';

const { sendLog } = require('./sender');
const { sanitizeString } = require('./utils/sanitizer');
const { shouldSend, getStats } = require('./utils/dedupe');
const { getGitContext } = require('./context/gitContext');
const { getSystemContext } = require('./context/systemContext');
const { getAppContext } = require('./context/appContext');

let appConfig = {};

/**
 * Format error with full rich context
 * This is what makes ProdPulse better than Sentry
 */
function formatErrorWithContext(error, additionalContext = {}) {
  try {
    // Parse stack trace for file/line info
    const stackInfo = parseStackTrace(error.stack);

    // Build rich log text
    const logText = `
ERROR TYPE: ${error.name || 'UnknownError'}
MESSAGE: ${sanitizeString(error.message || 'No message')}
STACK TRACE:
${sanitizeString(error.stack || 'No stack trace')}
    `.trim();

    // Build full context object
    const context = {
      // Error details
      error: {
        type: error.name || 'UnknownError',
        message: sanitizeString(error.message || ''),
        stack: sanitizeString(error.stack || ''),
        frames: stackInfo,
      },

      // Git context — which commit caused this?
      git: getGitContext(),

      // System context — CPU, memory at time of error
      system: getSystemContext(),

      // App context — version, environment, frameworks
      app: getAppContext(appConfig),

      // Request context — if available
      request: additionalContext.request || null,

      // Dedup stats — how many times has this error occurred?
      dedupe: getStats(error),

      // Any extra context passed manually
      extra: additionalContext.extra || null,

      // Timestamp
      timestamp: new Date().toISOString(),
    };

    return { logText, context };

  } catch (err) {
    // Fallback if context capture fails
    return {
      logText: `ERROR: ${error.message}\n${error.stack}`,
      context: { timestamp: new Date().toISOString() },
    };
  }
}

/**
 * Parse stack trace to extract file, line, function info
 */
function parseStackTrace(stack) {
  if (!stack) return [];

  try {
    const lines = stack.split('\n');
    const frames = [];

    for (const line of lines) {
      // Match: "    at FunctionName (file.js:line:col)"
      const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
      if (match) {
        const [, functionName, filePath, lineNumber, column] = match;

        // Skip node_modules frames
        const isInternal = filePath.includes('node_modules') ||
                          filePath.includes('internal/') ||
                          filePath.startsWith('node:');

        frames.push({
          function: functionName || '<anonymous>',
          file: filePath,
          line: parseInt(lineNumber),
          column: parseInt(column),
          isInternal,
        });
      }
    }

    // Return first 10 frames, prioritizing non-internal ones
    const appFrames = frames.filter(f => !f.isInternal);
    const allFrames = [...appFrames, ...frames.filter(f => f.isInternal)];
    return allFrames.slice(0, 10);

  } catch {
    return [];
  }
}

/**
 * Initialize error handler
 */
function initErrorHandler(apiKey, config = {}) {
  appConfig = config;

  // Catch uncaught exceptions
  process.on('uncaughtException', (error) => {
    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Caught uncaughtException:', error.message);
    }

    // Check deduplication
    if (!shouldSend(error)) {
      if (process.env.PRODPULSE_DEBUG === 'true') {
        console.log('[ProdPulse] Skipping duplicate uncaughtException');
      }
      setTimeout(() => process.exit(1), 500);
      return;
    }

    const { logText, context } = formatErrorWithContext(error, {
      extra: { type: 'uncaughtException' }
    });

    sendLog(apiKey, logText, context);

    // Give time to send before exit
    setTimeout(() => process.exit(1), 1500);
  });

  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Caught unhandledRejection:', error.message);
    }

    if (!shouldSend(error)) {
      if (process.env.PRODPULSE_DEBUG === 'true') {
        console.log('[ProdPulse] Skipping duplicate unhandledRejection');
      }
      return;
    }

    const { logText, context } = formatErrorWithContext(error, {
      extra: { type: 'unhandledRejection' }
    });

    sendLog(apiKey, logText, context);
  });

  // Intercept console.error
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Always call original first
    originalConsoleError(...args);

    try {
      const errorArg = args.find(a => a instanceof Error);
      if (errorArg) {
        if (!shouldSend(errorArg)) return;
        const { logText, context } = formatErrorWithContext(errorArg, {
          extra: { type: 'console.error' }
        });
        sendLog(apiKey, logText, context);
      } else {
        const log = args.map(a => sanitizeString(String(a))).join(' ');
        sendLog(apiKey, `CONSOLE ERROR:\n${log}\nTIMESTAMP: ${new Date().toISOString()}`);
      }
    } catch {
      // Never crash because of our SDK
    }
  };

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] Error handler initialized ✓');
    console.log('[ProdPulse] Git context:', getGitContext() ? '✓' : '✗ (not a git repo)');
    console.log('[ProdPulse] App context:', getAppContext(appConfig));
  }
}

/**
 * Manually capture an error with full context
 */
function captureError(apiKey, error, additionalContext = {}) {
  if (!shouldSend(error)) {
    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.log('[ProdPulse] Skipping duplicate error');
    }
    return;
  }

  const { logText, context } = formatErrorWithContext(error, additionalContext);
  sendLog(apiKey, logText, context);
}

module.exports = {
  initErrorHandler,
  captureError,
  formatErrorWithContext,
  parseStackTrace,
};