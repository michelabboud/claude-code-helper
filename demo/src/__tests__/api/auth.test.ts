/**
 * Authentication API Tests
 * Phase 7: Testing
 *
 * Tests for registration, login, and token validation flows.
 * Should trigger: qa-testing-expert
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken, refreshTokens } from '@/lib/auth/jwt';

// Mock user data
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'SecurePass123!',
  name: 'Test User',
};

describe('Authentication API', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(testUser.password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(testUser.password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix
    });

    it('should verify a correct password', async () => {
      const hash = await hashPassword(testUser.password);
      const isValid = await verifyPassword(testUser.password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const hash = await hashPassword(testUser.password);
      const isValid = await verifyPassword('wrongpassword', hash);

      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testUser.password);
      const hash2 = await hashPassword(testUser.password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate a token pair', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(15 * 60);
    });

    it('should generate valid access token', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const payload = await verifyAccessToken(tokens.accessToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUser.id);
      expect(payload?.email).toBe(testUser.email);
      expect(payload?.type).toBe('access');
    });

    it('should generate valid refresh token', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const payload = await verifyRefreshToken(tokens.refreshToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUser.id);
      expect(payload?.email).toBe(testUser.email);
      expect(payload?.type).toBe('refresh');
    });

    it('should not verify access token as refresh', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const payload = await verifyRefreshToken(tokens.accessToken);

      expect(payload).toBeNull();
    });

    it('should not verify refresh token as access', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const payload = await verifyAccessToken(tokens.refreshToken);

      expect(payload).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const initialTokens = await generateTokenPair(testUser.id, testUser.email);
      const newTokens = await refreshTokens(initialTokens.refreshToken);

      expect(newTokens).toBeDefined();
      expect(newTokens?.accessToken).toBeDefined();
      expect(newTokens?.refreshToken).toBeDefined();
      expect(newTokens?.accessToken).not.toBe(initialTokens.accessToken);
    });

    it('should reject refresh with access token', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const newTokens = await refreshTokens(tokens.accessToken);

      expect(newTokens).toBeNull();
    });

    it('should reject refresh with invalid token', async () => {
      const newTokens = await refreshTokens('invalid-token');

      expect(newTokens).toBeNull();
    });
  });

  describe('Token Validation', () => {
    it('should reject invalid token format', async () => {
      const payload = await verifyAccessToken('not-a-jwt');

      expect(payload).toBeNull();
    });

    it('should reject empty token', async () => {
      const payload = await verifyAccessToken('');

      expect(payload).toBeNull();
    });

    it('should reject tampered token', async () => {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      const tamperedToken = tokens.accessToken.slice(0, -5) + 'xxxxx';
      const payload = await verifyAccessToken(tamperedToken);

      expect(payload).toBeNull();
    });
  });
});

describe('Registration Flow', () => {
  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'a@b.co'];
    const invalidEmails = ['invalid', '@domain.com', 'test@', 'test@.com', ''];

    validEmails.forEach((email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });

  it('should validate password strength', () => {
    const weakPasswords = ['password', '12345678', 'abcdefgh'];
    const strongPasswords = ['SecurePass123!', 'MyP@ssw0rd!', 'Complex_Pass123'];

    weakPasswords.forEach((password) => {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isStrong = hasUppercase && hasLowercase && hasNumber && password.length >= 8;

      // At least one of these should fail for weak passwords
      expect(isStrong).toBe(false);
    });

    strongPasswords.forEach((password) => {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isStrong = hasUppercase && hasLowercase && hasNumber && password.length >= 8;

      expect(isStrong).toBe(true);
    });
  });

  it('should validate name length', () => {
    expect('A'.length >= 2).toBe(false);
    expect('Al'.length >= 2).toBe(true);
    expect('Alice'.length >= 2).toBe(true);
  });
});

describe('Login Flow', () => {
  it('should generate tokens on successful login', async () => {
    const hash = await hashPassword(testUser.password);
    const isValid = await verifyPassword(testUser.password, hash);

    expect(isValid).toBe(true);

    if (isValid) {
      const tokens = await generateTokenPair(testUser.id, testUser.email);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    }
  });

  it('should reject incorrect password', async () => {
    const hash = await hashPassword(testUser.password);
    const isValid = await verifyPassword('wrongpassword', hash);

    expect(isValid).toBe(false);
  });
});
