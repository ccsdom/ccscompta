import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

type ProvisioningConfig = {
  accountantEmail: string;
  accountantPassword: string;
  clientEmail: string;
  clientName: string;
  clientSiret: string;
};

function renderTemplate(value: string, timestamp: string) {
  return value.replaceAll('{timestamp}', timestamp);
}

function buildSiret(timestamp: string) {
  return timestamp.replace(/\D/g, '').slice(-14).padStart(14, '0');
}

function getProvisioningConfig(): ProvisioningConfig | null {
  const accountantEmail = process.env.SMOKE_ACCOUNTANT_EMAIL?.trim() || '';
  const accountantPassword = process.env.SMOKE_ACCOUNTANT_PASSWORD?.trim() || '';
  const clientEmailTemplate = process.env.SMOKE_PROVISION_CLIENT_EMAIL?.trim() || '';

  if (!accountantEmail || !accountantPassword || !clientEmailTemplate) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

  return {
    accountantEmail,
    accountantPassword,
    clientEmail: renderTemplate(clientEmailTemplate, timestamp),
    clientName: renderTemplate(process.env.SMOKE_PROVISION_CLIENT_NAME?.trim() || 'Client Smoke {timestamp}', timestamp),
    clientSiret: process.env.SMOKE_PROVISION_CLIENT_SIRET?.trim() || buildSiret(timestamp),
  };
}

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

async function signInAsAccountant(page: Page, config: ProvisioningConfig) {
  let firebaseAuthError: string | null = null;

  page.on('response', async (response) => {
    if (
      response.status() < 400 ||
      !response.url().includes('identitytoolkit.googleapis.com/v1/accounts:signInWithPassword')
    ) {
      return;
    }

    try {
      const payload = await response.json();
      firebaseAuthError = typeof payload?.error?.message === 'string'
        ? payload.error.message
        : `HTTP_${response.status()}`;
    } catch {
      firebaseAuthError = `HTTP_${response.status()}`;
    }
  });

  await page.goto('/connexion', { waitUntil: 'networkidle' });
  await fillStableValue(page.locator('#email'), config.accountantEmail);
  await fillStableValue(page.locator('#password'), config.accountantPassword);
  await page.locator('button[type="submit"]').click();

  try {
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard/accountant'), { timeout: 45_000 });
  } catch (error) {
    if (firebaseAuthError) {
      throw new Error(`Firebase login rejected for accountant: ${firebaseAuthError}`);
    }
    throw error;
  }
}

test.describe('Client provisioning smoke', () => {
  const config = getProvisioningConfig();

  test('accountant creates a client and queues activation email', async ({ page }) => {
    test.skip(!config, 'Set SMOKE_ACCOUNTANT_EMAIL, SMOKE_ACCOUNTANT_PASSWORD and SMOKE_PROVISION_CLIENT_EMAIL.');

    const runtimeErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));

    await signInAsAccountant(page, config!);

    await page.goto('/dashboard/clients/new', { waitUntil: 'networkidle' });

    await fillStableValue(page.getByPlaceholder(/nom de l'entreprise/i), config!.clientName);
    await fillStableValue(page.locator('input[type="email"]'), config!.clientEmail);
    await fillStableValue(page.getByPlaceholder(/14 chiffres/i), config!.clientSiret);
    await fillStableValue(page.getByPlaceholder(/adresse/i), '1 rue du Smoke Test, 75000 Paris');
    await fillStableValue(page.getByPlaceholder(/gerant|président|president/i), 'Responsable Smoke');

    await page.getByRole('button', { name: /valider le profil/i }).click();

    await expect(page.getByText(/email d'activation envoye/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/le client va recevoir un email/i)).toBeVisible();
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard/clients'), { timeout: 20_000 });

    const blockingError = runtimeErrors.find((line) => (
      /missing or insufficient permissions/i.test(line) ||
      /app\/no-options/i.test(line) ||
      /automatic initialization failed/i.test(line)
    ));
    expect(blockingError, 'Blocking runtime error detected during client provisioning').toBeUndefined();
  });
});
