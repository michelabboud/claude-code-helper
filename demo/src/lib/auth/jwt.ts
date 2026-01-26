/**
 * JWT Authentication Library
 * Phase 5: Authentication & Security
 *
 * Secure JWT token generation, verification, and refresh logic.
 * Should trigger: security-expert, nodejs-typescript-backend-expert
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRY = '7d'; // Longer-lived refresh tokens
const ISSUER = 'task-manager-pro';
const AUDIENCE = 'task-manager-pro-users';

// Convert secret to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

// Token payload types
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiry in seconds
}

/**
 * Generate an access token for a user
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    type: 'access',
  } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate a refresh token for a user
 */
export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    type: 'refresh',
  } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getSecretKey());

  return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(userId: string, email: string): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, email),
    generateRefreshToken(userId, email),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return payload as TokenPayload;
  } catch (error) {
    // Token is invalid, expired, or tampered with
    return null;
  }
}

/**
 * Verify specifically an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return null;
  }

  return payload;
}

/**
 * Verify specifically a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);

  if (!payload || payload.type !== 'refresh') {
    return null;
  }

  return payload;
}

/**
 * Refresh the token pair using a valid refresh token
 * Returns new token pair if refresh token is valid, null otherwise
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    return null;
  }

  // Generate new token pair
  return generateTokenPair(payload.userId, payload.email);
}

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Decode a token without verification (for debugging/logging)
 * WARNING: Do not trust the output of this function for authentication
 */
export function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired without full verification
 * Useful for client-side checks before making API calls
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenUnsafe(token);

  if (!payload || !payload.exp) {
    return true;
  }

  // Check if expiration time has passed (with 30 second buffer)
  return Date.now() >= (payload.exp * 1000 - 30000);
}

/**
 * Get the remaining time until token expiration
 * Returns milliseconds until expiration, or 0 if expired
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = decodeTokenUnsafe(token);

  if (!payload || !payload.exp) {
    return 0;
  }

  const remaining = payload.exp * 1000 - Date.now();
  return Math.max(0, remaining);
}
