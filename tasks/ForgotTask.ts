import { Actor } from '../actors/Actor';
import { TestInfo, expect } from '@playwright/test';

export class ForgotTask {
  constructor(private email: string, private siteConfig: any, private testInfo?: TestInfo) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, forgotPasswordUrl, forgotApiEndpoint } = this.siteConfig;

    // Optional: Setup API capture
    let capturePromise: Promise<void> | undefined;
    if (this.testInfo && forgotApiEndpoint) {
        capturePromise = page.waitForResponse(
              (response) => response.url().includes(forgotApiEndpoint) && response.request().method() === 'POST'
            ).then(async (response) => {
            const data = {
                url: response.url(),
                responseBody: await response.json(),
                status: response.status()
            };
            if (this.testInfo) {
              await this.testInfo.attach('forgot-api-response', {
                  body: JSON.stringify(data, null, 2),
                  contentType: 'application/json',
              });
            }
        }).catch(e => console.warn('Forgot Password API capture failed or page closed:', e));
    }

    await page.goto(forgotPasswordUrl);

    if (name === 'SCC') {
      await page.getByRole('textbox', { name: 'Email' }).fill(this.email);
      await page.getByRole('button', { name: 'Reset Password' }).click();
    } else if (name === 'CD') {
      await page.getByRole('textbox', { name: 'Enter your email address' }).fill(this.email);
      await page.getByRole('button', { name: 'Reset Password' }).click();
    } else {
      // Default to DVH and all others
      await page.getByRole('textbox', { name: 'Email Address' }).fill(this.email);
      await page.getByRole('button', { name: 'Reset password' }).click();
    }

    if (capturePromise) await capturePromise;
  }
}
