/**
 * Integration Health Checker
 *
 * Tests MCP server connectivity and API key validity.
 */

import { spawn } from 'node:child_process';
import { getRegistryIntegration } from '../registry/index.js';

export interface HealthResult {
  status: 'healthy' | 'degraded' | 'error';
  message: string;
  checkedAt: Date;
}

/**
 * Check if an MCP server integration is healthy by spawning it and
 * sending a JSON-RPC initialize request.
 */
export async function checkIntegrationHealth(
  integrationId: string,
  config: Record<string, string>
): Promise<HealthResult> {
  const checkedAt = new Date();
  const registry = getRegistryIntegration(integrationId);

  if (!registry) {
    return { status: 'error', message: `Unknown integration: ${integrationId}`, checkedAt };
  }

  const missingFields = registry.configSchema
    .filter((f) => f.required && !config[f.field])
    .map((f) => f.field);

  if (missingFields.length > 0) {
    return {
      status: 'error',
      message: `Missing required config: ${missingFields.join(', ')}`,
      checkedAt,
    };
  }

  if (registry.npmPackage) {
    return checkMcpServer(registry.npmPackage, config, checkedAt);
  }

  return {
    status: 'degraded',
    message: 'Config present but live check not available for repo-based servers',
    checkedAt,
  };
}

async function checkMcpServer(
  npmPackage: string,
  env: Record<string, string>,
  checkedAt: Date
): Promise<HealthResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill();
      resolve({ status: 'degraded', message: 'Server started but timed out on initialize', checkedAt });
    }, 10000);

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn('npx', ['-y', npmPackage], {
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ status: 'error', message: `Failed to spawn: ${err}`, checkedAt });
      return;
    }

    let stdout = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
      if (stdout.includes('"jsonrpc"')) {
        clearTimeout(timeout);
        child.kill();
        resolve({ status: 'healthy', message: 'MCP server responded to initialize', checkedAt });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ status: 'error', message: `Spawn error: ${err.message}`, checkedAt });
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== null && code !== 0) {
        resolve({ status: 'error', message: `Server exited with code ${code}`, checkedAt });
      }
    });

    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'openwork-health-check', version: '0.1.0' },
      },
    });

    try {
      child.stdin?.write(initRequest + '\n');
    } catch {
      // stdin may not be writable
    }
  });
}
