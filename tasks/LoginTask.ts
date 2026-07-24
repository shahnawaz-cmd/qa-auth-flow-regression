import { Actor } from '../actors/Actor';
import { TestInfo, expect } from '@playwright/test';

export class LoginTask {
  constructor(private email: string, private password: string, private siteConfig: any, private testInfo?: TestInfo) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, loginApiEndpoint } = this.siteConfig;

    // Optional: Setup API capture
    let capturePromise: Promise<void> | undefined;
    if (this.testInfo && loginApiEndpoint) {
        capturePromise = page.waitForResponse(
              (response) => response.url().includes(loginApiEndpoint) && response.request().method() === 'POST'
            ).then(async (response) => {
            const data = {
                url: response.url(),
                responseBody: await response.json(),
                status: response.status()
            };
            if (this.testInfo) {
              await this.testInfo.attach('login-api-response', {
                  body: JSON.stringify(data, null, 2),
                  contentType: 'application/json',
              });
            }
        }).catch(e => console.warn('Login API capture failed or page closed:', e));
    }

    // Login interaction based on site
    if (name === 'SCC') {
      await page.getByRole('textbox', { name: 'Email' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(this.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
    } else if (name === 'CD') {
      await page.getByRole('textbox', { name: 'Enter email address*' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Enter your password*' }).fill(this.password);
      await page.getByRole('button', { name: 'Login' }).click();
    } else if (name === 'VEHICLEHISTORY_EU') {
      await page.getByRole('textbox', { name: 'Email' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(this.password);
      await page.getByRole('button', { name: 'Access Dashboard' }).click();
    } else {
      // Default to DVH and FORD
      await page.getByRole('textbox', { name: 'Email Address' }).fill(this.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(this.password);
      await page.getByRole('button', { name: 'Access Dashboard' }).click();
    }

    if (capturePromise) await capturePromise;
  }

  async verifyLoginRedirection(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name } = this.siteConfig;

    if (name === 'CD') {
      await page.waitForURL('**/search');
      await expect(page).toHaveURL(/.*\/search/);
    } else if (name === 'SCC') {
      await page.waitForURL('**/dashboard?type=basic');
      await expect(page).toHaveURL(/.*\/dashboard\?type=basic/);
    } else {
      await page.waitForURL('**/dashboard*');
      await expect(page).toHaveURL(/.*\/dashboard.*/);
    }
  }
}
