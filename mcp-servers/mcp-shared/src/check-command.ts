/**
 * Utility to check if a CLI command is available on the system.
 * Used for startup health checks in exec-based MCP servers.
 */
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Check if a CLI command is available by running `which <command>`.
 * Returns true if the command exists, false otherwise.
 */
export async function checkCommand(command: string): Promise<boolean> {
  try {
    await execFileAsync("which", [command]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a HealthCheck object that verifies a CLI command is available.
 */
export function commandHealthCheck(command: string): import("./health.js").HealthCheck {
  return {
    name: `cli-${command}`,
    check: () => checkCommand(command),
  };
}
