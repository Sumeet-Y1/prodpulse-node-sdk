'use strict';

/**
 * ProdPulse Request Context
 * Captures HTTP request information at the time of error
 * Critical for debugging API errors
 */

const { sanitizeHeaders, sanitizeBody, sanitizeString } = require('../utils/sanitizer');

function extractRequestContext(req) {
  if (!req) return null;

  try {
    return {
      // Basic request info
      method: req.method || null,
      url: sanitizeString(req.url || req.path || null),
      baseUrl: sanitizeString(req.baseUrl || null),
      originalUrl: sanitizeString(req.originalUrl || null),

      // Headers (sanitized)
      headers: sanitizeHeaders(req.headers || {}),

      // Query params
      query: req.query ? sanitizeBody(JSON.stringify(req.query)) : null,

      // Body (sanitized)
      body: req.body ? sanitizeBody(JSON.stringify(req.body)) : null,

      // IP address (anonymized — remove last octet for privacy)
      ip: anonymizeIp(req.ip || req.connection?.remoteAddress || null),

      // User agent
      userAgent: req.headers?.['user-agent'] || null,

      // HTTP version
      httpVersion: req.httpVersion || null,

      // Protocol
      protocol: req.protocol || null,

      // Is HTTPS
      secure: req.secure || false,

      // Route info (Express specific)
      route: req.route?.path || null,

      // Params
      params: req.params ? sanitizeBody(JSON.stringify(req.params)) : null,

      // Cookies (sanitized — just keys, not values)
      cookies: req.cookies ? Object.keys(req.cookies) : null,

      // Content type
      contentType: req.headers?.['content-type'] || null,

      // Content length
      contentLength: req.headers?.['content-length'] || null,

      // Timestamp
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      error: 'Failed to capture request context',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Anonymize IP address for privacy
 * 192.168.1.123 → 192.168.1.xxx
 * 2001:db8::1 → 2001:db8::xxx
 */
function anonymizeIp(ip) {
  if (!ip) return null;

  try {
    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[3] = 'xxx';
      return parts.join('.');
    }

    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      parts[parts.length - 1] = 'xxx';
      return parts.join(':');
    }

    return '[IP_REDACTED]';
  } catch {
    return '[IP_REDACTED]';
  }
}

/**
 * Express middleware to attach request context to errors
 * Usage: app.use(prodpulse.requestMiddleware())
 */
function createRequestMiddleware() {
  return (req, res, next) => {
    // Attach request context to req object
    req._prodpulseContext = extractRequestContext(req);
    next();
  };
}

module.exports = {
  extractRequestContext,
  anonymizeIp,
  createRequestMiddleware,
};