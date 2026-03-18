'use strict';

/**
 * ProdPulse System Context
 * Captures system information at the time of error
 * CPU, memory, uptime — critical for diagnosing resource issues
 */

const os = require('os');
const process = require('process');

function getSystemContext() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    // Process memory usage
    const processMemory = process.memoryUsage();

    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuCount = cpus.length;

    // CPU usage (load average — Unix only)
    const loadAvg = os.loadavg();

    // Process uptime
    const processUptime = process.uptime();
    const systemUptime = os.uptime();

    return {
      // OS Info
      platform: os.platform(),
      arch: os.arch(),
      osRelease: os.release(),
      hostname: os.hostname(),

      // CPU
      cpu: {
        model: cpuModel,
        count: cpuCount,
        loadAvg1m: loadAvg[0]?.toFixed(2),
        loadAvg5m: loadAvg[1]?.toFixed(2),
        loadAvg15m: loadAvg[2]?.toFixed(2),
      },

      // System Memory
      memory: {
        total: formatBytes(totalMemory),
        free: formatBytes(freeMemory),
        used: formatBytes(usedMemory),
        usagePercent: `${memoryUsagePercent}%`,
      },

      // Process Memory (Node.js specific)
      processMemory: {
        heapUsed: formatBytes(processMemory.heapUsed),
        heapTotal: formatBytes(processMemory.heapTotal),
        rss: formatBytes(processMemory.rss),
        external: formatBytes(processMemory.external),
        heapUsagePercent: ((processMemory.heapUsed / processMemory.heapTotal) * 100).toFixed(2) + '%',
      },

      // Runtime
      nodeVersion: process.version,
      processId: process.pid,
      processUptime: formatUptime(processUptime),
      systemUptime: formatUptime(systemUptime),

      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch (err) {
    return {
      error: 'Failed to capture system context',
      nodeVersion: process.version,
    };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = { getSystemContext };