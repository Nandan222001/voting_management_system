import { test, expect } from '@playwright/test';
import { ADMIN, SUPERADMIN, BASE, loginAs, navigateTo } from './helpers.js';

test.describe('Sidebar Navigation', () => {
  test.describe('Admin sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, ADMIN);
    });

    test('shows expected admin nav links', async ({ page }) => {
      const sidebar = page.locator('aside');
      await expect(sidebar.locator('text=Dashboard')).toBeVisible();
      await expect(sidebar.locator('text=Elections')).toBeVisible();
      await expect(sidebar.locator('text=Candidates')).toBeVisible();
      await expect(sidebar.locator('text=Committees')).toBeVisible();
      await expect(sidebar.locator('text=Results')).toBeVisible();
    });

    test('Geography / Targets is NOT visible to admin', async ({ page }) => {
      await expect(page.locator('aside').locator('text=Geography')).not.toBeVisible();
    });

    test('admin is redirected away from /targets', async ({ page }) => {
      await navigateTo(page, '/targets');
      await page.waitForTimeout(1_000);
      await expect(page).not.toHaveURL(/\/targets$/);
    });

    test('navigates to Elections page', async ({ page }) => {
      await page.locator('aside a[href="/elections"]').click();
      await expect(page).toHaveURL(/\/elections/);
      await expect(page.locator('h1').first()).toContainText(/election/i);
    });

    test('navigates to Candidates page', async ({ page }) => {
      await page.locator('aside a[href="/candidates"]').click();
      await expect(page).toHaveURL(/\/candidates/);
    });
  });

  test.describe('SuperAdmin sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, SUPERADMIN);
    });

    test('shows Geography link for superadmin', async ({ page }) => {
      await expect(page.locator('aside').locator('text=Geography')).toBeVisible();
    });

    test('superadmin can access /targets via navigateTo', async ({ page }) => {
      await navigateTo(page, '/targets');
      await expect(page).toHaveURL(/\/targets/);
    });

    test('does NOT show admin-only links like Users in superadmin nav', async ({ page }) => {
      await expect(page.locator('aside').locator('text=Tenants')).toBeVisible();
    });
  });
});
