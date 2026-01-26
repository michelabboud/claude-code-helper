/**
 * Password Hashing Library
 * Phase 5: Authentication & Security
 *
 * Secure password hashing with bcrypt and strength validation.
 * Should trigger: security-expert
 */

import bcrypt from 'bcryptjs';

// Configuration
const SALT_ROUNDS = 12; // Recommended for production (higher = slower but more secure)
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Relaxed for better UX
};

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength against requirements
 */
export function validatePasswordStrength(
  password: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS
): PasswordStrengthResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length checks
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters`);
  } else {
    score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must be at most ${requirements.maxLength} characters`);
  }

  // Character type checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (requirements.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (hasUppercase) {
    score += 15;
  }

  if (requirements.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (hasLowercase) {
    score += 15;
  }

  if (requirements.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number');
  } else if (hasNumbers) {
    score += 15;
  }

  if (requirements.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  } else if (hasSpecialChars) {
    score += 15;
  }

  // Common patterns to avoid
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
    /^[a-z]+$/i, // Only letters
    /^[0-9]+$/, // Only numbers
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 20;
      suggestions.push('Avoid common password patterns');
      break;
    }
  }

  // Sequential characters check
  if (/abc|bcd|cde|def|efg|123|234|345|456|567|678|789/i.test(password)) {
    score -= 10;
    suggestions.push('Avoid sequential characters');
  }

  // Add suggestions based on missing features
  if (!hasUppercase) suggestions.push('Add uppercase letters for stronger password');
  if (!hasLowercase) suggestions.push('Add lowercase letters for stronger password');
  if (!hasNumbers) suggestions.push('Add numbers for stronger password');
  if (!hasSpecialChars) suggestions.push('Add special characters for stronger password');
  if (password.length < 12) suggestions.push('Use 12+ characters for better security');

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0,
    score,
    errors,
    suggestions: errors.length === 0 ? suggestions : [],
  };
}

/**
 * Get password strength level as a string
 */
export function getPasswordStrengthLevel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
  if (score < 30) return 'weak';
  if (score < 50) return 'fair';
  if (score < 75) return 'good';
  return 'strong';
}

/**
 * Generate a random secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password was potentially breached (basic check)
 * In production, consider using Have I Been Pwned API
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', 'password1', 'password123',
    '123456', '123456789', '12345678', '1234567890',
    'qwerty', 'abc123', 'monkey', 'letmein',
    'dragon', 'baseball', 'iloveyou', 'trustno1',
    'sunshine', 'master', 'welcome', 'shadow',
    'ashley', 'football', 'jesus', 'michael',
    'ninja', 'mustang', 'password1!',
  ];

  return commonPasswords.includes(password.toLowerCase());
}
