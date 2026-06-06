import { test, expect } from '@playwright/test';
import { ADMIN, loginAs, navigateTo } from './helpers.js';

async function hasEmptyState(page) {
  return (await page.locator('text=No records found').count()) > 0;
}

test.describe('DataTable ActionDropdown', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN);
  });

  test('Elections table has ActionDropdown or empty state', async ({ page }) => {
    await navigateTo(page, '/elections');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // If no data, verify empty state and skip
    if (await hasEmptyState(page)) {
      await expect(page.locator('text=No records found').first()).toBeVisible({ timeout: 5_000 });
      return;
    }

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count === 0) {
      await expect(page.locator('text=No records found').first()).toBeVisible({ timeout: 5_000 });
      return;
    }

    const actionCell = rows.first().locator('td').last();
    await expect(actionCell.locator('button')).toBeVisible();
    await actionCell.locator('button').click();
    await expect(page.locator('[role="menuitem"]').first()).toBeVisible({ timeout: 3_000 });
  });

  test('Users table has ActionDropdown menu', async ({ page }) => {
    await navigateTo(page, '/users');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    if (await hasEmptyState(page)) {
      await expect(page.locator('text=No records found').first()).toBeVisible({ timeout: 5_000 });
      return;
    }

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count === 0) {
      await expect(page.locator('text=No records found').first()).toBeVisible({ timeout: 5_000 });
      return;
    }

    const btn = rows.first().locator('td').last().locator('button');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('[role="menuitem"]').first()).toBeVisible({ timeout: 3_000 });
  });

  test('ActionDropdown closes on Escape key', async ({ page }) => {
    await navigateTo(page, '/users');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    if (await hasEmptyState(page)) { test.skip(); return; }

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    await rows.first().locator('td').last().locator('button').click();
    await expect(page.locator('[role="menuitem"]').first()).toBeVisible({ timeout: 2_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menuitem"]').first()).not.toBeVisible({ timeout: 2_000 });
  });

  test('Committees page renders content', async ({ page }) => {
    await navigateTo(page, '/candidate-committees');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const hasTable = await page.locator('table').count();
    const hasEmpty = await page.locator('text=No records found').count();
    const hasAdd = await page.locator('button:has-text("Add"), button:has-text("Create")').count();
    expect(hasTable + hasEmpty + hasAdd).toBeGreaterThan(0);
  });

  test('No raw Edit/Delete inline buttons visible in table rows', async ({ page }) => {
    await navigateTo(page, '/elections');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    if (await hasEmptyState(page)) return;

    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    if (count === 0) return;

    // Raw "Edit" text should NOT be directly visible as an inline button in the cell
    await expect(rows.first().locator('td button:has-text("Edit")')).not.toBeVisible();
  });
});
