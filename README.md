# prodpulse-node-sdk

Official Node.js SDK for [ProdPulse.AI](https://prodpulse.ai) — AI-powered production infrastructure & error monitoring.

## Installation
```bash
npm install prodpulse-node-sdk
```

## Quick Start
```javascript
const prodpulse = require('prodpulse-node-sdk');

// Initialize with your API key
prodpulse.init('pp_live_your_api_key_here');

// That's it! ProdPulse now monitors your app automatically.
```

## Features

### 🔴 Auto Error Detection
- ✅ Auto-captures uncaught exceptions
- ✅ Auto-captures unhandled promise rejections
- ✅ Monitors console.error calls
- ✅ Manual error capture

### 🗄️ Database Monitoring
- ✅ MySQL query monitoring + slow query detection
- ✅ PostgreSQL query monitoring + slow query detection
- ✅ MongoDB connection monitoring + disconnect alerts
- ✅ Slow query detection (>3 seconds)

### 🌐 HTTP Monitoring
- ✅ HTTP/HTTPS request error detection
- ✅ Slow HTTP request detection (>5 seconds)
- ✅ 5xx error detection

### 🤖 AI Powered
- ✅ Every error instantly analyzed by AI
- ✅ Plain English explanation of root cause
- ✅ Step by step fix instructions
- ✅ Estimated fix time

### 🔒 Privacy First
- ✅ Zero access to your codebase
- ✅ You control what gets sent
- ✅ Open source — verify yourself

## Database Monitoring

### MySQL
```javascript
const mysql = require('mysql2');
const prodpulse = require('prodpulse-node-sdk');

prodpulse.init('pp_live_xxx');

const connection = mysql.createConnection({ ... });
prodpulse.monitorDatabase(connection, 'mysql');
```

### PostgreSQL
```javascript
const { Pool } = require('pg');
const prodpulse = require('prodpulse-node-sdk');

prodpulse.init('pp_live_xxx');

const pool = new Pool({ ... });
prodpulse.monitorDatabase(pool, 'postgresql');
```

### MongoDB
```javascript
const mongoose = require('mongoose');
const prodpulse = require('prodpulse-node-sdk');

prodpulse.init('pp_live_xxx');

await mongoose.connect('mongodb://...');
prodpulse.monitorDatabase(mongoose, 'mongodb');
```

## Manual Capture
```javascript
try {
  // your code
} catch (err) {
  prodpulse.capture(err, { userId: '123', action: 'checkout' });
}
```

## Debug Mode
```bash
PRODPULSE_DEBUG=true node your-app.js
```

## Get Your API Key

1. Sign up at [prodpulse.ai](https://prodpulse.ai)
2. Go to Dashboard → API Keys
3. Generate a new key
4. Use `pp_live_` for production, `pp_test_` for development

## Support

- Email: support@prodpulse.ai
- Docs: docs.prodpulse.ai