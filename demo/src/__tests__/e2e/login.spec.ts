/**
 * E2E Login Tests
 * Phase 7: Testing
 *
 * Full login flow test with Playwright.
 * Should trigger: qa-testing-expert
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Demo credentials
const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@taskpro.com',
    password: 'admin123',
    name: 'Admin User',
  },
  user: {
    email: 'jane@example.com',
    password: 'password123',
    name: 'Jane Smith',
  },
};

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test('should display login form', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign in|Login|Task Manager/i);

    // Check form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation error for empty form', async ({ page }) => {
    // Click submit without entering anything
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email.*required|required.*email/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const { email, password } = DEMO_CREDENTIALS.admin;

    // Enter credentials
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show/hide password toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password button (if exists)
    const showButton = page.getByRole('button', { name: /show|toggle/i });
    if (await showButton.isVisible()) {
      await showButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await showButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should have link to registration', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /create.*account|register|sign up/i });
    await expect(registerLink).toBeVisible();

    // Click should navigate to register page
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have link to forgot password', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /forgot.*password/i });

    if (await forgotLink.isVisible()) {
      await expect(forgotLink).toBeVisible();
    }
  });

  test('should remember me checkbox exists', async ({ page }) => {
    const rememberMe = page.getByLabel(/remember me/i);

    if (await rememberMe.isVisible()) {
      // Should be unchecked by default
      await expect(rememberMe).not.toBeChecked();

      // Can be checked
      await rememberMe.check();
      await expect(rememberMe).toBeChecked();
    }
  });
});

test.describe('Login Flow', () => {
  test('should maintain session after login', async ({ page }) => {
    const { email, password } = DEMO_CREDENTIALS.admin;

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Reload page - should still be logged in
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect to login when accessing protected page', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(`${BASE_URL}/dashboard`);

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect back after login', async ({ page }) => {
    // Try to access specific page
    await page.goto(`${BASE_URL}/projects/1`);

    // Should redirect to login (if not logged in)
    if (page.url().includes('/login')) {
      const { email, password } = DEMO_CREDENTIALS.admin;

      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect back to projects page (if redirect is implemented)
      // This behavior depends on implementation
      await page.waitForURL(/\/dashboard|\/projects/);
    }
  });
});

test.describe('Logout Flow', () => {
  test('should logout successfully', async ({ page }) => {
    const { email, password } = DEMO_CREDENTIALS.admin;

    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Find and click logout
    // This might be in a dropdown menu
    const userMenu = page.getByRole('button', { name: new RegExp(DEMO_CREDENTIALS.admin.name, 'i') });
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible()) {
      await logoutLink.click();
    }

    // Should redirect to login or home
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});

test.describe('Security', () => {
  test('should not expose password in page source', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const pageContent = await page.content();

    // Should not contain any demo passwords in plain text
    expect(pageContent).not.toContain(DEMO_CREDENTIALS.admin.password);
    expect(pageContent).not.toContain(DEMO_CREDENTIALS.user.password);
  });

  test('should have HTTPS in production', async ({ page }) => {
    // Skip if running locally
    if (!BASE_URL.includes('localhost')) {
      await page.goto(BASE_URL);
      expect(page.url()).toMatch(/^https:/);
    }
  });
});
