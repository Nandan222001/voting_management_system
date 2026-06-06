// Shared helpers for E2E tests

export const ADMIN = { email: 'admin@voting.com', password: 'Admin@1234' };
export const SUPERADMIN = { email: 'superadmin@techElect.com', password: 'Admin@1234' };
export const BASE = 'http://localhost:5173';

/**
 * Log in via the UI and wait for dashboard.
 */
export async function loginAs(page, user) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="mail" i]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
}

/**
 * Navigate to a path using React Router (no full page reload).
 * Preserves the Redux store / auth state established by loginAs.
 */
export async function navigateTo(page, path) {
  // Use React Router's history API so Redux state is preserved
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, path);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });
}
