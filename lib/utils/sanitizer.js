'use strict';

/**
 * ProdPulse Security Sanitizer
 * Removes sensitive data before sending to ProdPulse servers
 * Zero sensitive data ever leaves your server
 */

const SENSITIVE_PATTERNS = [
  // Passwords
  { pattern: /password["'\s]*[:=]["'\s]*["']?[\w@#$%^&*!]+/gi, replacement: 'password=[REDACTED]' },
  { pattern: /passwd["'\s]*[:=]["'\s]*["']?[\w@#$%^&*!]+/gi, replacement: 'passwd=[REDACTED]' },
  { pattern: /pass["'\s]*[:=]["'\s]*["']?[\w@#$%^&*!]+/gi, replacement: 'pass=[REDACTED]' },

  // API Keys
  { pattern: /api[_-]?key["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /apikey["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'apikey=[REDACTED]' },

  // Tokens
  { pattern: /token["'\s]*[:=]["'\s]*["']?[\w\-\.]+/gi, replacement: 'token=[REDACTED]' },
  { pattern: /access[_-]?token["'\s]*[:=]["'\s]*["']?[\w\-\.]+/gi, replacement: 'access_token=[REDACTED]' },
  { pattern: /refresh[_-]?token["'\s]*[:=]["'\s]*["']?[\w\-\.]+/gi, replacement: 'refresh_token=[REDACTED]' },

  // Secrets
  { pattern: /secret["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'secret=[REDACTED]' },
  { pattern: /client[_-]?secret["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'client_secret=[REDACTED]' },

  // JWT Tokens
  { pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, replacement: '[JWT_REDACTED]' },

  // AWS Credentials
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[AWS_KEY_REDACTED]' },
  { pattern: /aws[_-]?secret["'\s]*[:=]["'\s]*["']?[\w\-\/+]+/gi, replacement: 'aws_secret=[REDACTED]' },
  { pattern: /aws[_-]?access["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'aws_access=[REDACTED]' },

  // Database URLs (most critical!)
  { pattern: /(?:mysql|postgres|postgresql|mongodb|redis|mssql):\/\/[^\s"'\]>]+/gi, replacement: '[DB_URL_REDACTED]' },
  { pattern: /(?:DATABASE|DB)[_-]?URL["'\s]*[:=]["'\s]*["']?[^\s"']+/gi, replacement: 'DB_URL=[REDACTED]' },
  { pattern: /(?:DATABASE|DB)[_-]?PASSWORD["'\s]*[:=]["'\s]*["']?[\w@#$%^&*!]+/gi, replacement: 'DB_PASSWORD=[REDACTED]' },

  // Credit Cards
  { pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },

  // Private Keys
  { pattern: /-----BEGIN [A-Z ]+ KEY-----[\s\S]+?-----END [A-Z ]+ KEY-----/g, replacement: '[PRIVATE_KEY_REDACTED]' },

  // Authorization headers
  { pattern: /bearer\s+[\w\-\.]+/gi, replacement: 'bearer [TOKEN_REDACTED]' },
  { pattern: /basic\s+[a-zA-Z0-9+\/=]+/gi, replacement: 'basic [AUTH_REDACTED]' },
  { pattern: /authorization["'\s]*[:=]["'\s]*["']?[\w\-\. ]+/gi, replacement: 'authorization=[REDACTED]' },

  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },

  // Phone numbers
  { pattern: /(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g, replacement: '[PHONE_REDACTED]' },

  // Social Security / Aadhaar
  { pattern: /\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, replacement: '[AADHAAR_REDACTED]' },

  // Google/GCP credentials
  { pattern: /AIza[0-9A-Za-z\-_]{35}/g, replacement: '[GOOGLE_KEY_REDACTED]' },

  // Stripe keys
  { pattern: /sk_live_[0-9a-zA-Z]{24}/g, replacement: '[STRIPE_KEY_REDACTED]' },
  { pattern: /pk_live_[0-9a-zA-Z]{24}/g, replacement: '[STRIPE_KEY_REDACTED]' },

  // GitHub tokens
  { pattern: /ghp_[0-9a-zA-Z]{36}/g, replacement: '[GITHUB_TOKEN_REDACTED]' },
  { pattern: /github[_-]?token["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'github_token=[REDACTED]' },

  // Generic private/sensitive keys
  { pattern: /private[_-]?key["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'private_key=[REDACTED]' },
  { pattern: /encryption[_-]?key["'\s]*[:=]["'\s]*["']?[\w\-]+/gi, replacement: 'encryption_key=[REDACTED]' },
];

const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-secret-key',
  'proxy-authorization',
];

const MAX_LOG_SIZE = 50000; // 50KB

/**
 * Sanitize a log string
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;

  // Truncate if too large
  if (str.length > MAX_LOG_SIZE) {
    str = str.substring(0, MAX_LOG_SIZE) + '\n[TRUNCATED]';
  }

  // Apply all patterns
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    str = str.replace(pattern, replacement);
  }

  return str;
}

/**
 * Sanitize HTTP headers
 */
function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeString(String(value));
    }
  }
  return sanitized;
}

/**
 * Sanitize request body
 */
function sanitizeBody(body) {
  if (!body) return null;

  try {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    return sanitizeString(str);
  } catch {
    return '[BODY_PARSE_ERROR]';
  }
}

/**
 * Sanitize any object recursively
 */
function sanitizeObject(obj, depth = 0) {
  if (depth > 5) return '[MAX_DEPTH]'; // prevent infinite recursion
  if (!obj || typeof obj !== 'object') return sanitizeString(String(obj));

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase()) ||
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = sanitizeString(String(value));
    }
  }
  return sanitized;
}

module.exports = {
  sanitizeString,
  sanitizeHeaders,
  sanitizeBody,
  sanitizeObject,
};