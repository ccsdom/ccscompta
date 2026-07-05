import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

const clientEmail = process.env.SMOKE_CLIENT_EMAIL?.trim() || '';
const clientPassword = process.env.SMOKE_CLIENT_PASSWORD?.trim() || '';

async function fillStableValue(locator: Locator, value: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await locator.fill(value);
    await locator.page().waitForTimeout(250);
    const currentValue = await locator.inputValue();
    if (currentValue === value) {
      return;
    }
  }
  throw new Error('Unable to persist input value for locator after retries.');
}

test.describe('Client Copilot & Banking E2E Smoke Test', () => {
  test('Access Copilot IA and Flux Bancaire as client', async ({ page }) => {
    test.skip(!clientEmail || !clientPassword, 'SMOKE_CLIENT_EMAIL and SMOKE_CLIENT_PASSWORD must be configured.');

    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      runtimeErrors.push(error.message);
    });

    // 1. Sign in as client
    await page.goto('/connexion', { waitUntil: 'networkidle' });
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await fillStableValue(emailInput, clientEmail);
    await fillStableValue(passwordInput, clientPassword);

    await expect(emailInput).toHaveValue(clientEmail);
    await expect(passwordInput).toHaveValue(clientPassword);

    await page.locator('button[type="submit"]').click();

    // Wait for client dashboard landing page (/dashboard/my-documents)
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard/my-documents'), { timeout: 45_000 });

    // 2. Navigate to Copilot IA page
    await page.goto('/dashboard/copilot', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard\/copilot/);

    // Verify AI Copilot page headers and widgets
    await expect(page.getByText(/Assistant IA/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/AI Accountant Copilot/i)).toBeVisible();

    // Verify chat input is functional
    const chatInput = page.locator('input[placeholder*="Faites une demande à l\'IA"]');
    await expect(chatInput).toBeVisible();

    // Type a message and send it
    const testQuery = "Combien ai-je dépensé au total ?";
    await fillStableValue(chatInput, testQuery);
    await expect(chatInput).toHaveValue(testQuery);

    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Verify the message has been posted into the feed
    await expect(page.getByText(testQuery)).toBeVisible();

    // 3. Navigate to Bank page
    await page.goto('/dashboard/my-bank', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/dashboard\/my-bank/);

    // Verify that banking controls, linked bank state or DS2 notice are visible
    const isLinked = await page.getByText(/Mon Flux Bancaire/i).isVisible();
    if (isLinked) {
      await expect(page.getByText(/Mon Flux Bancaire/i)).toBeVisible();
      await expect(page.getByText(/Transactions Récentes/i)).toBeVisible();
    } else {
      await expect(page.getByText(/Reliez votre Banque/i)).toBeVisible();
      await expect(page.getByText(/Connecter mes comptes/i)).toBeVisible();
    }

    // Verify no critical runtime/auth exceptions happened
    const blockingError = runtimeErrors.find((line) => (
      /missing or insufficient permissions/i.test(line) ||
      /app\/no-options/i.test(line) ||
      /automatic initialization failed/i.test(line)
    ));
    expect(blockingError, 'Critical runtime error detected').toBeUndefined();
  });
});
