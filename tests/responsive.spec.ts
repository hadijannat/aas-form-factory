import { test, expect } from '@playwright/test';

const viewports = [
  { width: 640, height: 900 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
];

for (const viewport of viewports) {
  test(`@responsive layout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
  });
}
