'use strict';

/**
 * ProdPulse App Context
 * Captures application information at the time of error
 * Version, environment, deploy info
 */

const path = require('path');
const fs = require('fs');

let cachedAppContext = null;

function getAppContext(userConfig = {}) {
  if (cachedAppContext) return { ...cachedAppContext, ...getDynamicContext() };

  try {
    // Read package.json for app info
    const packageJson = readPackageJson();

    cachedAppContext = {
      // App info from package.json
      appName: userConfig.appName || packageJson?.name || 'unknown',
      appVersion: userConfig.appVersion || packageJson?.version || 'unknown',
      appDescription: packageJson?.description || null,

      // Environment
      environment: userConfig.environment ||
                   process.env.NODE_ENV ||
                   process.env.APP_ENV ||
                   'unknown',

      // Deploy info
      deployId: userConfig.deployId ||
                process.env.DEPLOY_ID ||
                process.env.RENDER_GIT_COMMIT ||
                process.env.HEROKU_SLUG_COMMIT ||
                process.env.RAILWAY_GIT_COMMIT_SHA ||
                process.env.VERCEL_GIT_COMMIT_SHA ||
                null,

      // Server region
      region: userConfig.region ||
              process.env.RENDER_REGION ||
              process.env.AWS_REGION ||
              process.env.FLY_REGION ||
              null,

      // Service name
      serviceName: userConfig.serviceName ||
                   process.env.SERVICE_NAME ||
                   process.env.RENDER_SERVICE_NAME ||
                   packageJson?.name ||
                   null,

      // Runtime
      runtime: 'node.js',
      runtimeVersion: process.version,

      // Frameworks detected
      frameworks: detectFrameworks(packageJson),
    };

    return { ...cachedAppContext, ...getDynamicContext() };
  } catch {
    return {
      environment: process.env.NODE_ENV || 'unknown',
      runtime: 'node.js',
      runtimeVersion: process.version,
    };
  }
}

/**
 * Dynamic context that changes per request
 */
function getDynamicContext() {
  return {
    timestamp: new Date().toISOString(),
    processId: process.pid,
  };
}

/**
 * Read package.json from project root
 */
function readPackageJson() {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'package.json'),
      path.join(__dirname, '../../../../package.json'),
      path.join(__dirname, '../../../package.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Detect which frameworks are being used
 */
function detectFrameworks(packageJson) {
  if (!packageJson?.dependencies) return [];

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const frameworks = [];

  if (deps.express) frameworks.push(`express@${deps.express}`);
  if (deps.fastify) frameworks.push(`fastify@${deps.fastify}`);
  if (deps.koa) frameworks.push(`koa@${deps.koa}`);
  if (deps['@nestjs/core']) frameworks.push(`nestjs@${deps['@nestjs/core']}`);
  if (deps.hapi) frameworks.push(`hapi@${deps.hapi}`);
  if (deps.next) frameworks.push(`next@${deps.next}`);
  if (deps.nuxt) frameworks.push(`nuxt@${deps.nuxt}`);
  if (deps.mongoose) frameworks.push(`mongoose@${deps.mongoose}`);
  if (deps.sequelize) frameworks.push(`sequelize@${deps.sequelize}`);
  if (deps.prisma) frameworks.push(`prisma@${deps.prisma}`);
  if (deps.typeorm) frameworks.push(`typeorm@${deps.typeorm}`);

  return frameworks;
}

module.exports = { getAppContext };