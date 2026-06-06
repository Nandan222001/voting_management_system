import { test, expect } from '@playwright/test';
import { ADMIN, SUPERADMIN, BASE, loginAs } from './helpers.js';

test.describe('Authentication', () => {
  test('login page renders with SecureVote branding', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveTitle(/SecureVote/i);
    // Page should not redirect unauthenticated user away from /login
    await expect(page).toHaveURL(/login/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"], input[placeholder*="mail" i]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    // Should stay on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });

  test('admin logs in and reaches dashboard', async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page).toHaveURL(/dashboard/);
    // Sidebar should be visible
    await expect(page.locator('aside')).toBeVisible();
  });

  test('superadmin logs in and reaches dashboard', async ({ page }) => {
    await loginAs(page, SUPERADMIN);
    await expect(page).toHaveURL(/dashboard/);
    // SuperAdmin badge should be visible in sidebar
    await expect(page.locator('text=Platform Admin')).toBeVisible();
  });

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/candidates`);
    await expect(page).toHaveURL(/login/);
  });
});
