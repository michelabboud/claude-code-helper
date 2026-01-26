/**
 * CSRF Protection
 * Phase 5: Authentication & Security
 *
 * Cross-Site Request Forgery protection with double-submit cookies.
 * Should trigger: security-expert
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Configuration
const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_FORM_FIELD = '_csrf';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CsrfToken {
  token: string;
  expiresAt: number;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a CSRF token with expiration
 */
export function createCsrfToken(): CsrfToken {
  return {
    token: generateCsrfToken(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  };
}

/**
 * Set CSRF token in cookie
 * Uses SameSite=Strict for additional protection
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client needs to read this for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY_MS / 1000,
  });
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

/**
 * Extract CSRF token from request
 * Checks header first, then form body
 */
export function extractCsrfFromRequest(request: NextRequest): string | null {
  // Check header first (preferred for API requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // For form submissions, token would be in the body
  // This is handled separately in the validation middleware
  return null;
}

/**
 * Validate CSRF token (double-submit cookie pattern)
 * Compares the token from the request against the cookie
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieToken = await getCsrfFromCookie();
  const requestToken = extractCsrfFromRequest(request);

  if (!cookieToken || !requestToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, requestToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF validation for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return null; // Continue to next middleware
  }

  // Skip for specific paths (e.g., webhooks, public APIs)
  const skipPaths = ['/api/webhooks/', '/api/public/'];
  const pathname = request.nextUrl.pathname;
  if (skipPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  // Validate CSRF token
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    );
  }

  return null; // Continue to next middleware
}

/**
 * Initialize CSRF token for a new session
 * Should be called when user first visits the site
 */
export async function initializeCsrfToken(): Promise<string> {
  const { token } = createCsrfToken();
  await setCsrfCookie(token);
  return token;
}

/**
 * Refresh CSRF token
 * Should be called after successful authentication
 */
export async function refreshCsrfToken(): Promise<string> {
  return initializeCsrfToken();
}

/**
 * Generate a hidden form field with CSRF token
 * For use in server components
 */
export async function getCsrfFormField(): Promise<string> {
  const token = await getCsrfFromCookie();
  if (!token) {
    const newToken = await initializeCsrfToken();
    return `<input type="hidden" name="${CSRF_FORM_FIELD}" value="${newToken}" />`;
  }
  return `<input type="hidden" name="${CSRF_FORM_FIELD}" value="${token}" />`;
}

/**
 * React hook-friendly token getter
 * For client components, returns current token
 */
export function getCsrfTokenFromDocument(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Add CSRF token to fetch options
 * Utility for client-side API calls
 */
export function withCsrfToken(options: RequestInit = {}): RequestInit {
  const token = getCsrfTokenFromDocument();

  return {
    ...options,
    headers: {
      ...options.headers,
      [CSRF_HEADER_NAME]: token || '',
    },
  };
}
