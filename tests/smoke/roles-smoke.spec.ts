import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

type RoleKey = 'admin' | 'accountant' | 'secretary' | 'client';

type RoleScenario = {
  role: RoleKey;
  emailEnv: string;
  passwordEnv: string;
  expectedHomePath: string;
  forbiddenPaths: string[];
};

const scenarios: RoleScenario[] = [
  {
    role: 'admin',
    emailEnv: 'SMOKE_ADMIN_EMAIL',
    passwordEnv: 'SMOKE_ADMIN_PASSWORD',
    expectedHomePath: '/dashboard/admin',
    forbiddenPaths: [],
  },
  {
    role: 'accountant',
    emailEnv: 'SMOKE_ACCOUNTANT_EMAIL',
    passwordEnv: 'SMOKE_ACCOUNTANT_PASSWORD',
    expectedHomePath: '/dashboard/accountant',
    forbiddenPaths: ['/dashboard/admin', '/dashboard/admin/subscriptions'],
  },
  {
    role: 'secretary',
    emailEnv: 'SMOKE_SECRETARY_EMAIL',
    passwordEnv: 'SMOKE_SECRETARY_PASSWORD',
    expectedHomePath: '/dashboard/secretary',
    forbiddenPaths: ['/dashboard/admin', '/dashboard/admin/subscriptions'],
  },
  {
    role: 'client',
    emailEnv: 'SMOKE_CLIENT_EMAIL',
    passwordEnv: 'SMOKE_CLIENT_PASSWORD',
    expectedHomePath: '/dashboard/my-documents',
    forbiddenPaths: [
      '/dashboard/admin',
      '/dashboard/admin/subscriptions',
      '/dashboard/accountant',
      '/dashboard/clients',
      '/dashboard/documents',
    ],
  },
];

const blockerPatterns: RegExp[] = [
  /app\/no-options/i,
  /automatic initialization failed/i,
  /missing or insufficient permissions/i,
];

const nonBlockingNoisePatterns: RegExp[] = [
  /icon-512x512\.png/i,
  /manifest/i,
];

const forbiddenGuardHints = [
  'zone interdite',
  'acces refuse',
  'acces restreint',
  'permissions necessaires',
  'retour au tableau de bord',
  'retour au menu',
];

function getSelectedRoles() {
  const configuredRoles = process.env.SMOKE_ROLES?.trim();
  if (!configuredRoles) {
    return null;
  }

  const selectedRoles = new Set(
    configuredRoles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean),
  );

  return selectedRoles;
}

function getRoleCredentials(scenario: RoleScenario) {
  return {
    email: process.env[scenario.emailEnv]?.trim() || '',
    password: process.env[scenario.passwordEnv]?.trim() || '',
  };
}

function findBlockingError(logs: string[]) {
  for (const line of logs) {
    if (nonBlockingNoisePatterns.some((pattern) => pattern.test(line))) {
      continue;
    }
    if (blockerPatterns.some((pattern) => pattern.test(line))) {
      return line;
    }
  }
  return undefined;
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

  throw new Error(`Unable to persist input value for locator after retries.`);
}

test.describe('Connected role smoke', () => {
  test.describe.configure({ mode: 'serial' });

  const selectedRoles = getSelectedRoles();
  const selectedScenarios = selectedRoles
    ? scenarios.filter((scenario) => selectedRoles.has(scenario.role))
    : scenarios;

  if (selectedScenarios.length === 0) {
    test('No selected role matches a smoke scenario', () => {
      test.skip(true, 'SMOKE_ROLES must contain one of: admin, accountant, secretary, client.');
    });
    return;
  }

  const runnableScenarios = selectedScenarios.filter((scenario) => {
    const { email, password } = getRoleCredentials(scenario);
    return Boolean(email && password);
  });

  if (runnableScenarios.length === 0) {
    test('No role credentials configured', () => {
      test.skip(true, 'Set SMOKE_* role credentials for the selected smoke role(s).');
    });
    return;
  }

  for (const scenario of runnableScenarios) {
    test(`${scenario.role} login and authorization smoke`, async ({ page }) => {
      const { email, password } = getRoleCredentials(scenario);

      const runtimeErrors: string[] = [];
      let firebaseAuthError: string | null = null;

      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        runtimeErrors.push(message.text());
      });

      page.on('pageerror', (error) => {
        runtimeErrors.push(error.message);
      });

      page.on('response', async (response) => {
        if (
          response.status() < 400 ||
          !response.url().includes('identitytoolkit.googleapis.com/v1/accounts:signInWithPassword')
        ) {
          return;
        }

        try {
          const payload = await response.json();
          const message = payload?.error?.message;
          firebaseAuthError = typeof message === 'string' ? message : `HTTP_${response.status()}`;
        } catch {
          firebaseAuthError = `HTTP_${response.status()}`;
        }
      });

      await test.step('Sign in and land on expected dashboard', async () => {
        await page.goto('/connexion', { waitUntil: 'networkidle' });
        const emailInput = page.locator('#email');
        const passwordInput = page.locator('#password');

        await fillStableValue(emailInput, email);
        await fillStableValue(passwordInput, password);

        await expect(emailInput).toHaveValue(email);
        await expect(passwordInput).toHaveValue(password);

        await page.locator('button[type="submit"]').click();

        try {
          await page.waitForURL((url) => url.pathname.startsWith(scenario.expectedHomePath), { timeout: 45_000 });
        } catch (error) {
          if (firebaseAuthError) {
            throw new Error(`Firebase login rejected for ${scenario.role}: ${firebaseAuthError}`);
          }

          throw error;
        }

        await expect(page).toHaveURL(new RegExp(`${scenario.expectedHomePath.replace(/\//g, '\\/')}`));
        await expect(page.getByText('Configuration indisponible')).toHaveCount(0);

        const blockingError = findBlockingError(runtimeErrors);
        expect(blockingError, `Blocking console/runtime error detected for ${scenario.role}`).toBeUndefined();
      });

      for (const forbiddenPath of scenario.forbiddenPaths) {
        await test.step(`Forbidden route check: ${forbiddenPath}`, async () => {
          await page.goto(forbiddenPath, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1200);

          const currentPath = new URL(page.url()).pathname;
          const redirectedAway = !currentPath.startsWith(forbiddenPath);
          if (redirectedAway) {
            return;
          }

          const body = (await page.locator('body').innerText()).toLowerCase();
          const hasGuardMessage = forbiddenGuardHints.some((hint) => body.includes(hint));
          expect(
            hasGuardMessage,
            `${scenario.role} can still access forbidden route ${forbiddenPath} without guard/redirect.`,
          ).toBeTruthy();
        });
      }
    });
  }
});
