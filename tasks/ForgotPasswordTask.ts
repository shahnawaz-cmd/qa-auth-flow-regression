import { Actor } from '../actors/Actor';
import { TestInfo } from '@playwright/test';

export class ForgotPasswordTask {
  constructor(private email: string, private siteConfig: any, private testInfo?: TestInfo) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, forgotPasswordUrl, forgotApiEndpoint, timeout } = this.siteConfig;

    // Setup API capture with condition-based timeout
    const capturePromise = page.waitForResponse(
        (response) => response.url().includes(forgotApiEndpoint) && response.request().method() === 'POST',
        { timeout: timeout }
    ).then(async (response) => {
        const data = {
            url: response.url(),
            responseBody: await response.json(),
            status: response.status()
        };
        if (this.testInfo) {
          await this.testInfo.attach('forgot-password-api-response', {
              body: JSON.stringify(data, null, 2),
              contentType: 'application/json',
          });
        }
    }).catch(e => console.warn(`Forgot Password API capture failed or timed out (${timeout}ms):`, e));

    await page.goto(forgotPasswordUrl);

    // Perform action based on site
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

    await capturePromise;
  }
}
