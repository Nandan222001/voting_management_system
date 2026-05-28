import { test, expect } from '@playwright/test';
import { ADMIN, SUPERADMIN, loginAs, navigateTo } from './helpers.js';

test.describe('Geography / Targets access control', () => {
  test('admin cannot see Geography in sidebar', async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page.locator('aside').locator('text=Geography')).not.toBeVisible();
  });

  test('admin navigating to /targets is redirected away', async ({ page }) => {
    await loginAs(page, ADMIN);
    await navigateTo(page, '/targets');
    await page.waitForTimeout(1_000);
    await expect(page).not.toHaveURL(/\/targets$/);
  });

  test('superadmin sees Geography in sidebar', async ({ page }) => {
    await loginAs(page, SUPERADMIN);
    await expect(page.locator('aside').locator('text=Geography')).toBeVisible();
  });

  test('superadmin can navigate to /targets via sidebar link', async ({ page }) => {
    await loginAs(page, SUPERADMIN);
    await page.locator('aside a[href="/targets"]').click();
    await expect(page).toHaveURL(/\/targets/);
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
  });

  test('superadmin can navigate to /targets via React Router', async ({ page }) => {
    await loginAs(page, SUPERADMIN);
    await navigateTo(page, '/targets');
    await expect(page).toHaveURL(/\/targets/);
  });

  test('superadmin targets page has content', async ({ page }) => {
    await loginAs(page, SUPERADMIN);
    await page.locator('aside a[href="/targets"]').click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const hasAdd = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').count();
    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=No records found').count();
    expect(hasAdd + hasTable + hasEmpty).toBeGreaterThan(0);
  });
});
