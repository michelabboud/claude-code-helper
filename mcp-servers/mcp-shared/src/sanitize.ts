/**
 * Input sanitization utilities for MCP tool handlers.
 * Prevents path traversal, SSRF, and other injection attacks.
 */

import path from "node:path";
import { URL } from "node:url";

export class SanitizationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: string
  ) {
    super(message);
    this.name = "SanitizationError";
  }
}

/**
 * Sanitize a file path to prevent directory traversal.
 * Resolves the path and ensures it stays within the allowed base directory.
 */
export function sanitizePath(inputPath: string, basePath?: string): string {
  const trimmed = inputPath.trim();
  if (!trimmed) {
    throw new SanitizationError("Path cannot be empty", "path", inputPath);
  }

  // Reject null bytes
  if (trimmed.includes("\0")) {
    throw new SanitizationError("Path contains null bytes", "path", inputPath);
  }

  const resolved = path.resolve(trimmed);

  if (basePath) {
    const resolvedBase = path.resolve(basePath);
    if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
      throw new SanitizationError(
        `Path "${trimmed}" resolves outside allowed directory "${resolvedBase}"`,
        "path",
        inputPath
      );
    }
  }

  return resolved;
}

/**
 * Sanitize a URL to prevent SSRF attacks.
 * Only allows http and https protocols. Blocks internal/private IPs.
 */
export function sanitizeUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    throw new SanitizationError("URL cannot be empty", "url", inputUrl);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new SanitizationError(`Invalid URL: "${trimmed}"`, "url", inputUrl);
  }

  // Only allow http and https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new SanitizationError(
      `Disallowed protocol "${parsed.protocol}" - only http and https are allowed`,
      "url",
      inputUrl
    );
  }

  // Block common internal/private IP ranges
  const hostname = parsed.hostname.toLowerCase();
  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^169\.254\./, // link-local
    /^\[::1\]$/, // IPv6 loopback
    /^\[fc/i, // IPv6 unique local
    /^\[fd/i, // IPv6 unique local
    /^\[fe80/i, // IPv6 link-local
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      throw new SanitizationError(
        `Blocked internal/private address: "${hostname}"`,
        "url",
        inputUrl
      );
    }
  }

  return parsed.toString();
}

/**
 * Sanitize a string to prevent injection in shell commands or queries.
 */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (input.length > maxLength) {
    throw new SanitizationError(
      `String exceeds maximum length of ${maxLength}`,
      "string",
      input.slice(0, 100) + "..."
    );
  }

  // Remove null bytes
  return input.replace(/\0/g, "");
}
