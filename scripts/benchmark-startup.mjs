#!/usr/bin/env node

/**
 * MCP Server Startup Benchmark
 * Measures build time, startup time, and memory usage for each MCP server.
 * Run: node scripts/benchmark-startup.mjs
 */

import { execSync, spawn } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const MCP_DIR = join(ROOT, 'mcp-servers');

const SERVERS = readdirSync(MCP_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(MCP_DIR, d.name, 'package.json')))
  .map(d => d.name)
  .filter(name => name !== 'mcp-shared');

function formatMs(ms) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function measureBuildTime(serverDir) {
  const start = performance.now();
  try {
    execSync('npm run build', { cwd: serverDir, stdio: 'pipe' });
    return performance.now() - start;
  } catch {
    return -1;
  }
}

async function measureStartupTime(serverDir) {
  const indexPath = join(serverDir, 'build', 'index.js');
  if (!existsSync(indexPath)) return { time: -1, memory: 0 };

  return new Promise((resolve) => {
    const start = performance.now();
    const proc = spawn('node', [indexPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, MCP_LOG_LEVEL: 'error' },
    });

    let elapsed = -1;
    let memoryUsage = 0;

    proc.stderr.on('data', (data) => {
      const msg = data.toString();
      // Server is ready when it logs startup message
      if (msg.includes('"level":"info"') || msg.includes('running on stdio') || msg.includes('Server started')) {
        elapsed = performance.now() - start;
        // Give it a moment to settle, then measure memory
        setTimeout(() => {
          try {
            const memInfo = execSync(`ps -p ${proc.pid} -o rss=`, { stdio: 'pipe' }).toString().trim();
            memoryUsage = parseInt(memInfo) * 1024; // Convert KB to bytes
          } catch { /* process may have exited */ }
          proc.kill('SIGTERM');
        }, 200);
      }
    });

    const timeout = setTimeout(() => {
      elapsed = elapsed === -1 ? -2 : elapsed; // -2 means timeout
      proc.kill('SIGTERM');
    }, 15000);

    proc.on('close', () => {
      clearTimeout(timeout);
      resolve({ time: elapsed, memory: memoryUsage });
    });

    // Send empty input to trigger any stdin-dependent initialization
    proc.stdin.end();
  });
}

async function main() {
  console.log('MCP Server Performance Benchmark');
  console.log('='.repeat(80));
  console.log('');

  const results = [];

  for (const server of SERVERS) {
    const serverDir = join(MCP_DIR, server);
    process.stdout.write(`  ${server}... `);

    // Measure build time
    const buildTime = await measureBuildTime(serverDir);

    // Measure startup time and memory
    const { time: startupTime, memory } = await measureStartupTime(serverDir);

    const result = { server, buildTime, startupTime, memory };
    results.push(result);

    if (buildTime === -1) {
      console.log('BUILD FAILED');
    } else if (startupTime === -2) {
      console.log(`build: ${formatMs(buildTime)}, startup: TIMEOUT`);
    } else if (startupTime === -1) {
      console.log(`build: ${formatMs(buildTime)}, startup: NO BUILD OUTPUT`);
    } else {
      console.log(`build: ${formatMs(buildTime)}, startup: ${formatMs(startupTime)}, memory: ${formatBytes(memory)}`);
    }
  }

  // Summary table
  console.log('');
  console.log('Summary');
  console.log('-'.repeat(80));
  console.log(`${'Server'.padEnd(30)} ${'Build'.padStart(10)} ${'Startup'.padStart(10)} ${'Memory'.padStart(12)}`);
  console.log('-'.repeat(80));

  const validResults = results.filter(r => r.buildTime > 0 && r.startupTime > 0);

  for (const r of results) {
    const build = r.buildTime > 0 ? formatMs(r.buildTime) : 'FAILED';
    const startup = r.startupTime > 0 ? formatMs(r.startupTime) : r.startupTime === -2 ? 'TIMEOUT' : 'N/A';
    const memory = r.memory > 0 ? formatBytes(r.memory) : 'N/A';
    console.log(`${r.server.padEnd(30)} ${build.padStart(10)} ${startup.padStart(10)} ${memory.padStart(12)}`);
  }

  if (validResults.length > 0) {
    const avgBuild = validResults.reduce((s, r) => s + r.buildTime, 0) / validResults.length;
    const avgStartup = validResults.reduce((s, r) => s + r.startupTime, 0) / validResults.length;
    const avgMemory = validResults.reduce((s, r) => s + r.memory, 0) / validResults.length;
    console.log('-'.repeat(80));
    console.log(`${'AVERAGE'.padEnd(30)} ${formatMs(avgBuild).padStart(10)} ${formatMs(avgStartup).padStart(10)} ${formatBytes(avgMemory).padStart(12)}`);
  }

  console.log('');

  // Exit code based on thresholds
  const slowBuilds = validResults.filter(r => r.buildTime > 30000);
  const slowStartups = validResults.filter(r => r.startupTime > 5000);
  const buildFailures = results.filter(r => r.buildTime === -1);

  if (buildFailures.length > 0) {
    console.log(`WARNING: ${buildFailures.length} server(s) failed to build`);
    process.exit(1);
  }
  if (slowBuilds.length > 0) {
    console.log(`WARNING: ${slowBuilds.length} server(s) have build times > 30s`);
  }
  if (slowStartups.length > 0) {
    console.log(`WARNING: ${slowStartups.length} server(s) have startup times > 5s`);
  }
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
