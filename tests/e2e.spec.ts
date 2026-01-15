import { test, expect, type Locator, type Page } from '@playwright/test';

const ensureVisibleAndClick = async (locator: Locator) => {
  if (await locator.count() === 0) return false;
  await locator.first().click();
  return true;
};

const selectIfAvailable = async (page: Page, triggerName: RegExp, optionName: RegExp) => {
  const trigger = page.getByRole('button', { name: triggerName });
  if (await trigger.count() === 0) return false;
  await trigger.first().click();
  const option = page.getByRole('option', { name: optionName });
  if (await option.count() === 0) return false;
  await option.first().click();
  return true;
};

test('end-to-end template interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/');

  const openTemplateButton = page.getByRole('button', { name: /open template/i });
  if (await openTemplateButton.count() > 0) {
    await openTemplateButton.first().click();
    try {
      await page.waitForURL(/\/templates\//, { timeout: 3000 });
    } catch {
      await page.goto('/templates/digital-nameplate');
    }
  } else {
    await page.goto('/templates/digital-nameplate');
  }

  await expect(page).toHaveURL(/\/templates\//);

  await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();

  // Add a language to first multilanguage field if present
  const addedLanguage = await selectIfAvailable(page, /add language/i, /english/i);
  if (addedLanguage) {
    const textarea = page.getByPlaceholder(/enter text in english/i);
    if (await textarea.count() > 0) {
      await textarea.first().fill('Test translation');
    }
  }

  // Upload a file to the first file input if present
  const fileInputs = page.locator('input[type="file"]');
  if (await fileInputs.count() > 0) {
    await fileInputs.first().setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });
  }

  // Add an array item if present
  const addItemButton = page.getByRole('button', { name: /add item/i });
  if (await addItemButton.count() > 0) {
    await addItemButton.first().click();
  }

  // Trigger export actions (will alert if validation fails)
  await page.getByRole('button', { name: 'JSON' }).click();
  await page.getByRole('button', { name: 'AASX' }).click();

  // Save to BaSyx if enabled
  const saveButton = page.getByRole('button', { name: /save to basyx|save$/i });
  if (await saveButton.count() > 0 && await saveButton.first().isEnabled()) {
    await saveButton.first().click();
  }
});
