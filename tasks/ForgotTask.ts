import { Actor } from '../actors/Actor';
import { TestInfo } from '@playwright/test';
import { fastInputWithHealing, clickWithHealing } from '../utils/selfHealingLocator';

export class ForgotTask {
  constructor(
    private email: string,
    private siteConfig: any,
    private testInfo?: TestInfo,
    private isSlowNetwork: boolean = false
  ) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, forgotPasswordUrl, forgotApiEndpoint, timeout: configTimeout } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 60000 : (configTimeout || 30000);

    // Optional: Setup API capture
    let capturePromise: Promise<void> | undefined;
    if (this.testInfo && forgotApiEndpoint) {
      capturePromise = page.waitForResponse(
        (response) => response.url().includes(forgotApiEndpoint) && response.request().method() === 'POST',
        { timeout }
      ).then(async (response) => {
        let responseBody: any = {};
        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = { text: await response.text().catch(() => '') };
        }
        const data = {
          url: response.url(),
          responseBody,
          status: response.status()
        };
        if (this.testInfo) {
          await this.testInfo.attach('forgot-api-response', {
            body: JSON.stringify(data, null, 2),
            contentType: 'application/json',
          });
        }
      }).catch(e => console.warn(`[ForgotTask] API capture warning on ${name}:`, e.message));
    }

    await page.goto(forgotPasswordUrl, { waitUntil: 'domcontentloaded', timeout });

    const emailFallbacks = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'textbox[name="Enter your email address"]'
    ];

    await fastInputWithHealing(
      page,
      'email',
      this.email,
      emailFallbacks,
      { isSlowNetwork: this.isSlowNetwork, timeout }
    );

    const submitFallbacks = [
      'button[type="submit"]',
      'button:has-text("Reset Password")',
      'button:has-text("Reset password")',
      'button:has-text("Send Reset Link")'
    ];

    await clickWithHealing(
      page,
      'Reset Password',
      submitFallbacks,
      { isSlowNetwork: this.isSlowNetwork, strategyTimeout: 5000 }
    );

    if (capturePromise) {
      await capturePromise.catch(() => {});
    }
  }
}
