'use strict';

const { sendLog } = require('./sender');

function formatError(error) {
  return `
ERROR TYPE: ${error.name || 'UnknownError'}
MESSAGE: ${error.message || 'No message'}
STACK TRACE:
${error.stack || 'No stack trace available'}
TIMESTAMP: ${new Date().toISOString()}
NODE VERSION: ${process.version}
PLATFORM: ${process.platform}
  `.trim();
}

function initErrorHandler(apiKey) {
  // Catch uncaught exceptions
  process.on('uncaughtException', (error) => {
    const formatted = formatError(error);
    sendLog(apiKey, formatted);

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Caught uncaughtException:', error.message);
    }

    // Give time to send log before process exits
    setTimeout(() => process.exit(1), 1000);
  });

  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const formatted = formatError(error);
    sendLog(apiKey, formatted);

    if (process.env.PRODPULSE_DEBUG === 'true') {
      console.error('[ProdPulse] Caught unhandledRejection:', error.message);
    }
  });

  // Intercept console.error
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const log = args.map(a => 
      a instanceof Error ? formatError(a) : String(a)
    ).join(' ');
    
    sendLog(apiKey, `CONSOLE ERROR:\n${log}\nTIMESTAMP: ${new Date().toISOString()}`);
    originalConsoleError(...args); // still logs normally
  };

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] Error handler initialized ✓');
  }
}

module.exports = { initErrorHandler };