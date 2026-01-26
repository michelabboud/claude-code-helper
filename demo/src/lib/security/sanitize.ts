/**
 * Input Sanitization
 * Phase 5: Authentication & Security
 *
 * XSS prevention and input sanitization utilities.
 * Should trigger: security-expert
 */

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;',
};

// Regex patterns for dangerous content
const DANGEROUS_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  event: /\bon\w+\s*=/gi,
  javascript: /javascript:/gi,
  data: /data:[^,]*;base64,/gi,
  vbscript: /vbscript:/gi,
  expression: /expression\s*\(/gi,
  url: /url\s*\(/gi,
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#96;': '`',
    '&#x3D;': '=',
  };

  return str.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#96|#x3D);/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .trim();
}

/**
 * Remove potentially dangerous HTML/JS patterns
 */
export function sanitizeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  let sanitized = str;

  // Remove script tags and their content
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.script, '');

  // Remove event handlers
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.event, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.javascript, '');

  // Remove data: URLs (potential XSS vector)
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.data, '');

  // Remove vbscript: URLs
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.vbscript, '');

  // Remove CSS expressions
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.expression, '');

  // Remove CSS url() (can be used for data exfiltration)
  sanitized = sanitized.replace(DANGEROUS_PATTERNS.url, '');

  return sanitized;
}

/**
 * Sanitize a string for safe use in URLs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // Only allow http(s), mailto, and tel protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  try {
    const parsed = new URL(url, 'https://example.com');

    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    return url;
  } catch {
    // Relative URLs are generally safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '';
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/[\/\\:*?"<>|]/g, '') // Remove dangerous characters
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/^\./, '') // Remove leading dots
    .trim()
    .slice(0, 255); // Limit length
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'string') {
        return escapeHtml(item);
      }
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item as Record<string, unknown>);
      }
      return item;
    }) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = escapeHtml(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = escapeHtml(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Remove any potential XSS
  return escapeHtml(trimmed);
}

/**
 * Sanitize SQL-like patterns (additional layer on top of Prisma)
 * Note: Prisma already prevents SQL injection, this is for defense in depth
 */
export function sanitizeSqlLike(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // Escape SQL wildcards and special characters
  return str
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/;/g, '')
    .replace(/--/g, '');
}

/**
 * Sanitize for JSON embedding
 */
export function sanitizeForJson(str: string): string {
  if (typeof str !== 'string') {
    return JSON.stringify(str);
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
}

/**
 * Validate that a string contains only allowed characters
 */
export function isAlphanumeric(str: string, allowSpaces: boolean = false): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  const regex = allowSpaces ? /^[a-zA-Z0-9 ]+$/ : /^[a-zA-Z0-9]+$/;
  return regex.test(str);
}

/**
 * Truncate string to max length safely (won't cut in middle of HTML entity)
 */
export function truncateSafe(str: string, maxLength: number, suffix: string = '...'): string {
  if (typeof str !== 'string' || str.length <= maxLength) {
    return str;
  }

  const truncated = str.slice(0, maxLength - suffix.length);

  // Don't cut in the middle of an HTML entity
  const lastAmp = truncated.lastIndexOf('&');
  const lastSemi = truncated.lastIndexOf(';');

  if (lastAmp > lastSemi) {
    return truncated.slice(0, lastAmp) + suffix;
  }

  return truncated + suffix;
}

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[\r\n]+/g, '\n') // Normalize line endings
    .trim();
}

/**
 * Content Security Policy nonce generator
 */
export function generateCspNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Sanitize rich text content (markdown-like)
 * Allows safe formatting while removing dangerous patterns
 */
export function sanitizeRichText(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // First sanitize HTML
  let sanitized = sanitizeHtml(str);

  // Allow specific safe markdown patterns
  // Bold, italic, code, links are generally safe when properly escaped
  // The escapeHtml call at the end ensures safety

  return escapeHtml(sanitized);
}
