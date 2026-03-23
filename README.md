<div align="center">

<br />

```
██████╗ ██████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
██████╔╝██████╔╝██║   ██║██║  ██║
██╔═══╝ ██╔══██╗██║   ██║██║  ██║
██║     ██║  ██║╚██████╔╝██████╔╝
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝

██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██████╔╝██║   ██║██║     ███████╗█████╗
██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
██║     ╚██████╔╝███████╗███████║███████╗
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
```

## `prodpulse-node-sdk`

**The official Node.js SDK for [ProdPulse.AI](https://prodpulse-frontend.pages.dev)**

AI-powered production monitoring. Understand and fix errors instantly — with full context, zero guesswork.

<br />

[![npm](https://img.shields.io/badge/npm-v2.0.0-E53935?style=flat-square&logo=npm&logoColor=white)](https://npmjs.com/package/prodpulse-node-sdk)
[![node](https://img.shields.io/badge/node-%3E%3D16.0.0-43A047?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-1E88E5?style=flat-square)](./LICENSE)
[![tls](https://img.shields.io/badge/TLS-1.2%2B%20enforced-FB8C00?style=flat-square&logo=letsencrypt&logoColor=white)](https://prodpulse.ai/security)
[![build](https://img.shields.io/badge/build-passing-00897B?style=flat-square)]()

<br />

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [What's New in v2.0.0](#-whats-new-in-v200)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Get Your API Key](#-get-your-api-key)
- [Configuration](#️-configuration)
- [Express & Fastify Middleware](#-express--fastify-middleware)
- [Database Monitoring](#️-database-monitoring)
- [Manual Error Capture](#-manual-error-capture)
- [Security & Auto-Sanitization](#-security--auto-sanitization)
- [Offline Queue & Resilience](#-offline-queue--resilience)
- [Debug Mode](#-debug-mode)
- [Context Snapshot](#-context-snapshot)
- [API Reference](#-api-reference)
- [Support](#-support)

---

## 🔭 Overview

`prodpulse-node-sdk` gives your Node.js applications a complete observability layer. Every error is captured with **deep context** — not just a stack trace, but the exact git commit that introduced it, the system state at the time, the HTTP request that triggered it, and a security-scrubbed snapshot of your environment.

Built for production. Designed to be invisible until you need it.

```
your app  →  prodpulse sdk  →  context engine  →  prodpulse.ai dashboard
                  ↓
          ┌───────────────┐
          │  git context  │  which commit, branch, author
          │  sys context  │  cpu, memory, uptime
          │  app context  │  version, env, framework
          │  req context  │  method, url, sanitized headers
          │  dedup engine │  once per hour, max
          │  offline queue│  never lose an error
          └───────────────┘
```

---

## 🆕 What's New in v2.0.0

v2.0.0 ships a fully rewritten context engine. Every error event now carries a **360° diagnostic payload** so you can reproduce and fix issues without ever asking *"what was the state of the system?"*

| # | Feature | Description |
|---|---|---|
| 1 | 🧩 **Rich Context Capture** | File path, line number, and function name on every error — no sourcemaps needed |
| 2 | 🌿 **Git Context** | Commit SHA, branch name, and author of the offending code, auto-detected |
| 3 | 💻 **System Context** | CPU usage, total/free memory, and process uptime at moment of error |
| 4 | 📦 **App Context** | App version, environment, and auto-detected framework (Express, Fastify, Koa, NestJS) |
| 5 | 🌐 **Request Context** | HTTP method, URL, sanitized headers, and request ID for every inbound request |
| 6 | 🔐 **Security Sanitization** | Passwords, JWTs, AWS keys, DB URLs, and credit cards auto-redacted before leaving your server |
| 7 | 🔁 **Smart Deduplication** | The same error fires at most once per hour — clean dashboards, intact quota |
| 8 | 📡 **Offline Queue** | Errors are queued in memory when the API is unreachable and flushed on reconnect |
| 9 | 🛡️ **Express Middleware** | Drop-in `requestMiddleware` and `errorMiddleware` for full HTTP observability |
| 10 | 🔒 **TLS 1.2+ Enforced** | All outbound connections enforce TLS 1.2 minimum — no exceptions |
| 11 | 🔄 **Exponential Backoff** | Transient delivery failures retry automatically with backoff — no thundering herd |

---

## 📦 Installation

```bash
# npm
npm install prodpulse-node-sdk

# yarn
yarn add prodpulse-node-sdk

# pnpm
pnpm add prodpulse-node-sdk
```

**Requirements:** Node.js `>= 16.0.0`

---

## 🚀 Quick Start

Add this **at the very top** of your application entry file, before any other `require()` calls. This ensures that even startup errors are captured.

```js
// ✅ app.js — line 1

const prodpulse = require('prodpulse-node-sdk');

prodpulse.init('pp_live_xxx', {
  appName:     'My API',
  appVersion:  '2.0.2,
  environment: 'production',
});

// All unhandled errors and promise rejections are now captured automatically.
// Continue loading the rest of your application below.
const express = require('express');
// ...
```

That's it. `uncaughtException` and `unhandledRejection` are both captured by default — no additional wiring required.

---

## 🔑 Get Your API Key

1. Sign up or log in at **[app.prodpulse.ai](https://prodpulse-frontend.pages.dev)**
2. Navigate to **Settings → API Keys**
3. Create a new key — choose `pp_live_` for production or `pp_test_` for development
4. Copy the key and pass it to `prodpulse.init()`

> **Keep your API key secret.** Do not commit it to source control. Use environment variables:
>
> ```js
> prodpulse.init(process.env.PRODPULSE_API_KEY, { ... });
> ```

---

## ⚙️ Configuration

`prodpulse.init(apiKey, options)` accepts the following options:

| Option | Type | Default | Description |
|---|---|---|---|
| `appName` | `string` | `'unnamed-app'` | Human-readable application name shown in the dashboard |
| `appVersion` | `string` | `'0.0.0'` | Your application's semantic version |
| `environment` | `string` | `'production'` | Deployment environment — `'development'`, `'staging'`, or `'production'` |
| `captureUnhandled` | `boolean` | `true` | Auto-capture `uncaughtException` and `unhandledRejection` events |
| `deduplicationWindow` | `number` | `3600` | Seconds before the same error is eligible to be sent again (default: 1 hour) |
| `maxQueueSize` | `number` | `100` | Max offline queue depth — oldest events are dropped when exceeded |
| `sanitize` | `boolean` | `true` | Enable automatic secret redaction. Locked `true` in production |
| `ignoredErrors` | `string[]` | `[]` | Error message substrings to silently discard |
| `beforeSend` | `function` | `null` | `(event) => event \| null` — modify or suppress events before dispatch |
| `debug` | `boolean` | `false` | Enable verbose SDK logging (see [Debug Mode](#-debug-mode)) |
| `endpoint` | `string` | Auto | Override the ingestion endpoint for self-hosted or proxy deployments |

### Full Configuration Example

```js
prodpulse.init(process.env.PRODPULSE_API_KEY, {
  appName:     'Payments Service',
  appVersion:  process.env.npm_package_version,
  environment: process.env.NODE_ENV,

  // Suppress noisy, unactionable errors
  ignoredErrors: ['ECONNRESET', 'socket hang up', 'read ETIMEDOUT'],

  // Deduplicate aggressively in high-traffic services
  deduplicationWindow: 1800, // 30 minutes

  // Enrich or gate events before they are sent
  beforeSend: (event) => {
    // Drop health-check triggered errors
    if (event.request?.url === '/health') return null;

    // Attach business context
    event.tags = {
      ...event.tags,
      team:   'platform',
      region: process.env.AWS_REGION,
    };

    return event;
  },
});
```

---

## 🌐 Express & Fastify Middleware

### Express

Mount `requestMiddleware` **as the first middleware** and `errorMiddleware` **as the last** — after all routes and other middleware.

```js
const express   = require('express');
const prodpulse = require('prodpulse-node-sdk');

prodpulse.init(process.env.PRODPULSE_API_KEY, {
  appName:     'My API',
  environment: 'production',
});

const app = express();

// ① First — attaches request context to every incoming request
app.use(prodpulse.requestMiddleware());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your routes
app.get('/users/:id', async (req, res) => { /* ... */ });
app.post('/checkout',  async (req, res) => { /* ... */ });

// ② Last — captures errors from all routes and middleware above
app.use(prodpulse.errorMiddleware());

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Fastify

```js
const fastify   = require('fastify')({ logger: true });
const prodpulse = require('prodpulse-node-sdk');

prodpulse.init(process.env.PRODPULSE_API_KEY, {
  appName:     'My Fastify API',
  environment: 'production',
});

// Attach request context on every incoming request
fastify.addHook('onRequest', prodpulse.requestMiddleware());

// Capture all errors thrown by route handlers
fastify.setErrorHandler(prodpulse.errorMiddleware());

fastify.listen({ port: 3000 });
```

### What gets captured per request

| Field | Example Value | Notes |
|---|---|---|
| `method` | `POST` | — |
| `url` | `/api/v1/checkout` | Query params sanitized |
| `statusCode` | `500` | — |
| `ip` | `103.21.×.×` | Partially masked |
| `userAgent` | `Mozilla/5.0 ...` | — |
| `requestId` | `req_7f3k2p` | Auto-generated if not present |
| `authorization` | `[REDACTED]` | Always scrubbed |
| `cookie` | `[REDACTED]` | Always scrubbed |
| `x-api-key` | `[REDACTED]` | Always scrubbed |
| `x-auth-token` | `[REDACTED]` | Always scrubbed |

---

## 🗄️ Database Monitoring

Monitor query performance and connection errors across your entire data layer with a single call per connection.

```js
const prodpulse = require('prodpulse-node-sdk');
const mysql     = require('mysql2');
const { Pool }  = require('pg');
const mongoose  = require('mongoose');

// Create your connections as usual
const mysqlConn = mysql.createConnection({ host: 'localhost', database: 'mydb' });
const pgPool    = new Pool({ connectionString: process.env.DATABASE_URL });

// Hand them to ProdPulse — instrumentation is applied automatically
prodpulse.monitorDatabase(mysqlConn, 'mysql');
prodpulse.monitorDatabase(pgPool,    'postgresql');
prodpulse.monitorDatabase(mongoose,  'mongodb');
```

**What gets tracked:**

- Slow query detection with configurable threshold
- Connection errors and pool exhaustion events
- Failed transactions and rollbacks
- Query fingerprints (parameterized — raw values are never captured)
- Database type and connection metadata

---

## 🎯 Manual Error Capture

Use `prodpulse.capture()` anywhere you catch errors yourself, or to record custom events with structured metadata.

```js
const prodpulse = require('prodpulse-node-sdk');

// ── Basic capture ────────────────────────────────────────────────────────────

prodpulse.capture(new Error('Payment gateway timed out'));


// ── With structured context ──────────────────────────────────────────────────

try {
  await processCheckout(cart);
} catch (err) {
  prodpulse.capture(err, {
    userId:   'usr_8a3f9c',
    orderId:  'ord_992kl1',
    cart:     { items: 3, totalCents: 429900 },
    region:   'ap-south-1',
  });
  res.status(500).json({ error: 'Checkout failed' });
}


// ── Custom string events (non-Error) ────────────────────────────────────────

prodpulse.capture('webhook.signature_mismatch', {
  webhookId: 'wh_live_xxx',
  severity:  'warning',
  source:    'payment-provider',
});
```

### `beforeSend` — Modify Events Before Dispatch

```js
prodpulse.init(process.env.PRODPULSE_API_KEY, {
  beforeSend: (event) => {
    // Return null to silently drop the event
    if (event.user?.role === 'bot') return null;

    // Attach any runtime metadata
    event.tags = {
      ...event.tags,
      deploymentId: process.env.DEPLOYMENT_ID,
    };

    return event; // Always return the event to send it
  },
});
```

---

## 🔐 Security & Auto-Sanitization

ProdPulse v2.0.0 applies **automatic, recursive sanitization** to every outbound event. Sensitive values are replaced with `[REDACTED]` before any data leaves your process — not at the server, in the SDK itself.

### Auto-Redacted Patterns

| Category | Detected By | Example Input | Sent as |
|---|---|---|---|
| 🔑 **Passwords** | Field names: `password`, `passwd`, `pwd`, `secret`, `pass` | `"hunter2"` | `[REDACTED]` |
| 🪙 **JWT Tokens** | `eyJ` prefix pattern | `"eyJhbGciOiJIUzI1..."` | `[REDACTED]` |
| ☁️ **AWS Access Keys** | `AKIA` prefix pattern (20-char) | `"AKIAIOSFODNN7EXAMPLE"` | `[REDACTED]` |
| ☁️ **AWS Secret Keys** | Field names: `aws_secret`, `secretAccessKey` | `"wJalrXUtnFEMI..."` | `[REDACTED]` |
| 🗄️ **Database URLs** | URI schemes: `mongodb://`, `postgres://`, `mysql://`, `redis://` | `"postgres://user:pass@host/db"` | `[REDACTED]` |
| 💳 **Credit Cards** | Luhn-valid 13–19 digit sequences | `"4111111111111111"` | `[REDACTED]` |
| 🔐 **Private Keys** | PEM block headers | `"-----BEGIN RSA PRIVATE KEY-----"` | `[REDACTED]` |
| 🍪 **Cookies** | Header names: `cookie`, `set-cookie` | `"session=abc123; Path=/"` | `[REDACTED]` |
| 🔒 **Auth Headers** | `authorization`, `x-api-key`, `x-auth-token`, `x-access-token` | `"Bearer sk_live_xxx"` | `[REDACTED]` |
| 🪪 **PII Fields** | `ssn`, `aadhar`, `pan`, `nric`, `cvv`, `otp`, `pin` | `"123-45-6789"` | `[REDACTED]` |
| 🔗 **Query Params** | `?token=`, `?key=`, `?secret=`, `?password=` in URLs | `/reset?token=abc123` | `/reset?token=[REDACTED]` |

### Sanitization Scope

Sanitization is applied recursively across all of the following:

- Custom context objects passed to `prodpulse.capture(err, context)`
- HTTP request headers captured by `requestMiddleware()`
- Error messages that contain secret-shaped strings
- URL query parameters
- Any nested objects, regardless of depth

### Disabling Sanitization

```js
prodpulse.init('pp_test_xxx', {
  sanitize: false, // ⚠️ Development/testing only
});
```

> **Note:** `sanitize` is permanently locked to `true` when `environment` is set to `'production'`. This cannot be overridden.

---

## 📡 Offline Queue & Resilience

The SDK never blocks your application and never loses an error event, even when your network is unavailable.

```
 ┌──────────────┐     ┌─────────────────────┐     ┌─────────────────┐
 │   your app   │────▶│  prodpulse-node-sdk  │────▶│  prodpulse api  │
 └──────────────┘     └─────────────────────┘     └─────────────────┘
                                │                          ▲
                         on failure                        │
                                ▼                   on reconnect
                       ┌──────────────┐                   │
                       │ offline queue│───────────────────▶│
                       │  (in-memory) │   flush with backoff
                       └──────────────┘
```

**Queue behaviour:**

1. Every captured error is dispatched immediately and asynchronously
2. On API failure, the event is pushed to an in-memory queue
3. The SDK probes for connectivity on a 30-second interval
4. On reconnect, queued events are delivered oldest-first
5. When the queue reaches `maxQueueSize`, the oldest event is evicted to make room

### Retry Schedule

| Retry Attempt | Delay Before Attempt |
|---|---|
| 1st | 1 s |
| 2nd | 2 s |
| 3rd | 4 s |
| 4th | 8 s |
| 5th | 16 s |
| 6th+ | 16 s (capped) |

---

## 🐛 Debug Mode

Enable verbose SDK output to verify what is being captured, what is being redacted, and whether events are being delivered.

**Via environment variable (recommended):**

```bash
PRODPULSE_DEBUG=true node app.js
```

**Via configuration:**

```js
prodpulse.init(process.env.PRODPULSE_API_KEY, {
  debug: process.env.NODE_ENV !== 'production',
});
```

**Sample debug output:**

```
[ProdPulse] ✔  Initialized — app: "Payments Service" | env: production | sdk: v2.0.0
[ProdPulse] ✔  Git context — commit: a3f9c12 | branch: feat/checkout | author: dev@example.com
[ProdPulse] ▶  Capturing — Error: "Payment gateway timed out"
[ProdPulse]    Source: src/services/payment.js:142 in processCharge()
[ProdPulse] ✔  Sanitization — 3 field(s) redacted
[ProdPulse] ✔  Deduplication — new fingerprint, sending
[ProdPulse] ✔  Delivered — eventId: evt_k9z2m1 | latency: 38ms
```

---

## 🔍 Context Snapshot

Call `prodpulse.getContext()` at any time to inspect the full diagnostic payload that ProdPulse attaches to every event.

```js
const ctx = prodpulse.getContext();
console.log(JSON.stringify(ctx, null, 2));
```

```json
{
  "app": {
    "name":        "Payments Service",
    "version":     "3.4.1",
    "environment": "production",
    "framework":   "express@4.18.2",
    "nodeVersion": "v20.11.0",
    "pid":         28341
  },
  "git": {
    "commit":  "a3f9c12e",
    "branch":  "feat/checkout-v2",
    "author":  "dev@example.com",
    "message": "Add retry logic to payment processor"
  },
  "system": {
    "platform":    "linux",
    "arch":        "x64",
    "hostname":    "prod-api-07",
    "cpuUsage":    "18%",
    "memoryTotal": "8 GB",
    "memoryFree":  "2.9 GB",
    "uptimeHours": 312.7
  },
  "sdk": {
    "name":    "prodpulse-node-sdk",
    "version": "2.0.0"
  }
}
```

---

## 📚 API Reference

### `prodpulse.init(apiKey, options)`

Initializes the SDK. Call **once**, as early as possible in your application entry file.

| Parameter | Type | Required |
|---|---|---|
| `apiKey` | `string` | ✅ |
| `options` | `InitOptions` | ❌ |

---

### `prodpulse.capture(error, context?)`

Manually captures and dispatches an error event.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `error` | `Error \| string` | ✅ | The error or message to capture |
| `context` | `object` | ❌ | Arbitrary metadata to attach to the event |

**Returns:** `Promise<string>` — the assigned event ID, or `null` if dropped by deduplication or `beforeSend`.

---

### `prodpulse.requestMiddleware()`

Returns an Express/Fastify middleware function that attaches full HTTP request context to all captured errors within the request lifecycle.

---

### `prodpulse.errorMiddleware()`

Returns a 4-argument Express error handler `(err, req, res, next)` that captures, enriches, and forwards all errors that pass through the Express error pipeline.

---

### `prodpulse.monitorDatabase(connection, type)`

Instruments a database connection for query-level monitoring.

| Parameter | Type | Required | Accepted Values |
|---|---|---|---|
| `connection` | `object` | ✅ | Your connection, pool, or ODM instance |
| `type` | `string` | ✅ | `'mysql'` · `'postgresql'` · `'mongodb'` · `'redis'` |

---

### `prodpulse.getContext()`

Returns a plain object snapshot of the current SDK context — app, git, system, and SDK metadata.

**Returns:** `ContextSnapshot`

---

## 🤝 Support

| Channel | Where to go |
|---|---|
| 📖 **Documentation** | [coming soon]() |
| 💬 **Community Discord** | [coming soon]() |
| 🐛 **Bug Reports** | [coming soon]() |
| 🚀 **Feature Requests** | [coming soon]() |
| 📧 **Enterprise & Priority Support** | [coming soon]() |
| 🐦 **Updates** | [coming soon]() |

---

<div align="center">

<br />

**Found ProdPulse useful? Give us a ⭐ on GitHub — it helps more than you'd think.**

<br />

[prodpulse.ai](https://d224b3db.prodpulse-landing.pages.dev) &nbsp;·&nbsp; [Dashboard](https://app.prodpulse.ai) &nbsp;·&nbsp; [Docs](https://docs.prodpulse.ai) &nbsp;·&nbsp; [Changelog](https://docs.prodpulse.ai/changelog) &nbsp;·&nbsp; [Status](https://status.prodpulse.ai)

<br />

MIT License &nbsp;©&nbsp; 2026 ProdPulse Technologies

</div>