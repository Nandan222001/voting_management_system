import { test, expect } from '@playwright/test';
import { ADMIN, loginAs, navigateTo } from './helpers.js';

test.describe('Revenue Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN);
    await navigateTo(page, '/revenue');
    // Wait for the stats section to render
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 10_000 });
  });

  test('renders stats cards', async ({ page }) => {
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Successful')).toBeVisible();
    await expect(page.locator('text=Failed').first()).toBeVisible();
  });

  test('renders Razorpay Configuration card', async ({ page }) => {
    await expect(page.locator('text=Razorpay Configuration')).toBeVisible();
    await expect(page.getByText('KEY ID', { exact: false })).toBeVisible();
    await expect(page.getByText('KEY SECRET', { exact: false })).toBeVisible();
    await expect(page.locator('button:has-text("Save Keys")')).toBeVisible();
  });

  test('Key Secret field starts as password, toggle reveals it', async ({ page }) => {
    const secretInput = page.locator('input[type="password"]').first();
    await expect(secretInput).toBeVisible();
    await secretInput.fill('my_secret_value');

    // Click the toggle button (eye icon) next to the password field
    await page.locator('button[type="button"]:near(input[type="password"])').first().click();
    // After reveal, should be text input
    await expect(page.locator('input[type="text"]').filter({ hasText: '' }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('shows Not Configured badge initially', async ({ page }) => {
    await expect(page.locator('text=Not Configured')).toBeVisible();
  });

  test('Save Keys shows toast error when fields are empty', async ({ page }) => {
    await page.click('button:has-text("Save Keys")');
    await expect(page.locator('text=required').first()).toBeVisible({ timeout: 5_000 });
  });

  test('renders Collect Payment card with all inputs', async ({ page }) => {
    await expect(page.locator('text=Collect Payment')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Open Razorpay Checkout")')).toBeVisible();
  });

  test('Collect Payment errors when Key ID not set', async ({ page }) => {
    await page.fill('input[type="number"]', '500');
    await page.click('button:has-text("Open Razorpay Checkout")');
    await expect(page.locator('text=Configure Razorpay Key ID first').first()).toBeVisible({ timeout: 5_000 });
  });

  test('renders Transaction History table', async ({ page }) => {
    await expect(page.locator('text=Transaction History')).toBeVisible();
    await expect(page.locator('text=Transaction ID')).toBeVisible();
    await expect(page.locator('text=Amount').first()).toBeVisible();
    await expect(page.locator('text=Status').first()).toBeVisible();
  });

  test('amount validation enforces minimum of ₹1', async ({ page }) => {
    await page.locator('input[placeholder*="rzp"], input[placeholder*="Key"]').first().fill('rzp_test_key');
    await page.fill('input[type="number"]', '0');
    await page.click('button:has-text("Open Razorpay Checkout")');
    await expect(page.locator('text=Minimum amount').first()).toBeVisible({ timeout: 5_000 });
  });
});
