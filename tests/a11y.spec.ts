import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@a11y home has no critical violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === 'critical');

  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
