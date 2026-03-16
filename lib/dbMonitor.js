'use strict';

const { sendLog } = require('./sender');

function formatDbError(type, error, query = null) {
  return `
DB ERROR
Type: ${type.toUpperCase()}
Message: ${error.message || 'Unknown error'}
${query ? `Query: ${query}` : ''}
Stack: ${error.stack || 'No stack trace'}
Timestamp: ${new Date().toISOString()}
  `.trim();
}

function monitorMySQL(apiKey, connection) {
  if (!connection) {
    console.warn('[ProdPulse] MySQL connection not provided');
    return;
  }

  // Monitor connection errors
  connection.on('error', (err) => {
    sendLog(apiKey, formatDbError('mysql', err));
  });

  // Wrap query method to catch failed queries
  const originalQuery = connection.query.bind(connection);
  connection.query = (sql, values, callback) => {
    const start = Date.now();

    const cb = (err, results, fields) => {
      if (err) {
        sendLog(apiKey, formatDbError('mysql', err, typeof sql === 'string' ? sql : sql.sql));
      }

      // Detect slow queries (over 3 seconds)
      const duration = Date.now() - start;
      if (duration > 3000) {
        sendLog(apiKey, `
SLOW QUERY DETECTED
Type: MYSQL
Duration: ${duration}ms
Query: ${typeof sql === 'string' ? sql : sql.sql}
Timestamp: ${new Date().toISOString()}
        `.trim());
      }

      if (typeof values === 'function') values(err, results, fields);
      else if (typeof callback === 'function') callback(err, results, fields);
    };

    if (typeof values === 'function') return originalQuery(sql, cb);
    return originalQuery(sql, values, cb);
  };

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] MySQL monitor initialized ✓');
  }
}

function monitorPostgres(apiKey, pool) {
  if (!pool) {
    console.warn('[ProdPulse] PostgreSQL pool not provided');
    return;
  }

  // Monitor pool errors
  pool.on('error', (err) => {
    sendLog(apiKey, formatDbError('postgresql', err));
  });

  // Wrap query method
  const originalQuery = pool.query.bind(pool);
  pool.query = async (text, params) => {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);

      // Detect slow queries
      const duration = Date.now() - start;
      if (duration > 3000) {
        sendLog(apiKey, `
SLOW QUERY DETECTED
Type: POSTGRESQL
Duration: ${duration}ms
Query: ${typeof text === 'string' ? text : JSON.stringify(text)}
Timestamp: ${new Date().toISOString()}
        `.trim());
      }

      return result;
    } catch (err) {
      sendLog(apiKey, formatDbError('postgresql', err, typeof text === 'string' ? text : JSON.stringify(text)));
      throw err; // rethrow so their app still handles it
    }
  };

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] PostgreSQL monitor initialized ✓');
  }
}

function monitorMongoDB(apiKey, mongoose) {
  if (!mongoose) {
    console.warn('[ProdPulse] Mongoose instance not provided');
    return;
  }

  // Monitor connection errors
  mongoose.connection.on('error', (err) => {
    sendLog(apiKey, formatDbError('mongodb', err));
  });

  mongoose.connection.on('disconnected', () => {
    sendLog(apiKey, `
DB DISCONNECTED
Type: MONGODB
Message: MongoDB connection lost
Timestamp: ${new Date().toISOString()}
    `.trim());
  });

  if (process.env.PRODPULSE_DEBUG === 'true') {
    console.log('[ProdPulse] MongoDB monitor initialized ✓');
  }
}

module.exports = { monitorMySQL, monitorPostgres, monitorMongoDB };