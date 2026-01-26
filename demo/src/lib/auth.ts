/**
 * Authentication Utilities
 * Phase 2: Backend API
 *
 * JWT token management and password hashing utilities.
 * Should trigger: security-expert, nodejs-typescript-backend-expert
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { hash, compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';
import type { User } from '@prisma/client';

// Configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-me');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'auth-token';
const SALT_ROUNDS = 10;

// Types
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// JWT utilities
export async function createToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
  const expiresIn = parseExpiration(JWT_EXPIRES_IN);

  return new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// Cookie management
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseExpirationToSeconds(JWT_EXPIRES_IN),
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current user from request
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  return user;
}

// Authorization helpers
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export async function checkTeamAccess(userId: string, teamId: string): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return !!member;
}

export async function checkTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return member?.role === 'OWNER' || member?.role === 'ADMIN';
}

export async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  if (!project) return false;
  return checkTeamAccess(userId, project.teamId);
}

// Custom error class
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Helper functions
function parseExpiration(exp: string): string {
  // Convert '7d' format to jose-compatible format
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return '7d';

  const [, value, unit] = match;
  const units: Record<string, string> = {
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
  };

  return `${value} ${units[unit] || 'days'}`;
}

function parseExpirationToSeconds(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * (multipliers[unit] || 24 * 60 * 60);
}
