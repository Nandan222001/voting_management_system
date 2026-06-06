import { test, expect } from '@playwright/test';
import { ADMIN, loginAs, navigateTo } from './helpers.js';

const ELECTIONS_API = 'http://localhost:8000/api/v1/elections/';

async function fetchElections(page) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const res = await page.request.get(ELECTIONS_API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return [];
  const body = await res.json();
  return body.data ?? body.elections ?? body.items ?? [];
}

test.describe('Candidates Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN);
    await navigateTo(page, '/candidates');
  });

  test('renders election selector and empty state', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Select an Election')).toBeVisible();
    await expect(page.locator('button:has-text("Add Candidate")')).not.toBeVisible();
  });

  test('Add Candidate button appears when a draft election is selected', async ({ page }) => {
    const elections = await fetchElections(page);
    const draftElection = elections.find((e) => e.status === 'draft');
    if (!draftElection) { test.skip(); return; }

    await page.selectOption('select', String(draftElection.id));
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    await expect(page.locator('button:has-text("Add Candidate")')).toBeVisible();
  });

  test('Add Candidate button opens modal with form', async ({ page }) => {
    const elections = await fetchElections(page);
    const draftElection = elections.find((e) => e.status === 'draft');
    if (!draftElection) { test.skip(); return; }

    await page.selectOption('select', String(draftElection.id));
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    await page.click('button:has-text("Add Candidate")');

    await expect(page.locator('input[required]').first()).toBeVisible({ timeout: 5_000 });
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(400);
    await expect(page.locator('input[required]').first()).not.toBeVisible();
  });

  test('candidates table shows ActionDropdown on each row', async ({ page }) => {
    const elections = await fetchElections(page);
    const draftElection = elections.find((e) => e.status === 'draft');
    if (!draftElection) { test.skip(); return; }

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const cr = await page.request.get(
      `http://localhost:8000/api/v1/candidates/?election_id=${draftElection.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const cb = await cr.json();
    const candidates = cb.data ?? cb.candidates ?? cb.items ?? [];
    if (candidates.length === 0) { test.skip(); return; }

    await page.selectOption('select', String(draftElection.id));
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const actionBtn = page.locator('table tbody tr').first().locator('td').last().locator('button');
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();
    await expect(page.locator('text=Edit').first()).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('text=Delete').first()).toBeVisible({ timeout: 3_000 });
  });
});
