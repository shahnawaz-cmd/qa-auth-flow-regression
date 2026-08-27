import { Actor } from '../actors/Actor';
import { TestInfo, expect } from '@playwright/test';
import { fastInputWithHealing, clickWithHealing, locateInputWithHealing } from '../utils/selfHealingLocator';
import { dismissAllPopups } from './DismissPopupTask';

export class LoginTask {
  constructor(
    private email: string,
    private password: string,
    private siteConfig: any,
    private testInfo?: TestInfo,
    private isSlowNetwork: boolean = false
  ) {}

  async performAs(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name, loginApiEndpoint, selectors } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 90000 : 45000;

    console.log(`[LoginTask] Attempting login for site "${name}" (Email: ${this.email})...`);

    // 0. Dismiss any external popups, cookie dialogs, or banner overlays
    await dismissAllPopups(page, 1500);

    // Optional: Setup API capture
    let capturePromise: Promise<void> | undefined;
    if (this.testInfo && loginApiEndpoint) {
      capturePromise = page.waitForResponse(
        (response) => response.url().includes(loginApiEndpoint) && response.request().method() === 'POST',
        { timeout: 45000 }
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
          await this.testInfo.attach('login-api-response', {
            body: JSON.stringify(data, null, 2),
            contentType: 'application/json',
          });
        }
      }).catch(e => console.warn(`[LoginTask] Login API capture note on ${name}:`, e.message));
    }

    // 1. Resilient Email Input (with React Hydration Protection)
    const emailFallbacks = [
      ...(selectors?.email ? [selectors.email] : []),
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'textbox[name="Enter email address*"]'
    ];

    const emailInput = await locateInputWithHealing(
      page,
      'email',
      emailFallbacks,
      { isSlowNetwork: this.isSlowNetwork, timeout }
    );

    await emailInput.waitFor({ state: 'visible', timeout });
    await emailInput.click();
    await emailInput.fill(this.email);
    await emailInput.dispatchEvent('input').catch(() => {});
    await emailInput.dispatchEvent('change').catch(() => {});

    // React hydration reset protection on login
    await page.waitForTimeout(400);
    const currentEmailVal = await emailInput.inputValue().catch(() => '');
    if (currentEmailVal !== this.email) {
      console.log(`[Self-Healing] React hydration reset detected on ${name} login. Re-filling Email...`);
      await emailInput.click();
      await emailInput.fill(this.email);
      await emailInput.dispatchEvent('input').catch(() => {});
      await emailInput.dispatchEvent('change').catch(() => {});
    }

    // 2. Resilient Password Input (with React Hydration Protection)
    const passwordFallbacks = [
      ...(selectors?.password ? [selectors.password] : []),
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]'
    ];

    const passwordInput = await locateInputWithHealing(
      page,
      'password',
      passwordFallbacks,
      { isSlowNetwork: this.isSlowNetwork, timeout }
    );

    await passwordInput.waitFor({ state: 'visible', timeout });
    await passwordInput.click();
    await passwordInput.fill(this.password);
    await passwordInput.dispatchEvent('input').catch(() => {});
    await passwordInput.dispatchEvent('change').catch(() => {});

    await page.waitForTimeout(300);
    const currentPassVal = await passwordInput.inputValue().catch(() => '');
    if (currentPassVal !== this.password) {
      console.log(`[Self-Healing] React hydration reset detected on ${name} password. Re-filling Password...`);
      await passwordInput.click();
      await passwordInput.fill(this.password);
      await passwordInput.dispatchEvent('input').catch(() => {});
      await passwordInput.dispatchEvent('change').catch(() => {});
    }

    // Dismiss overlay again before submit
    await dismissAllPopups(page, 500);

    // 3. Resilient Submit / Login Button
    const submitFallbacks = [
      ...(selectors?.submit ? [selectors.submit] : []),
      'button[type="submit"]',
      'button:has-text("Access Dashboard")',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Log In")'
    ];

    await clickWithHealing(
      page,
      'Access Dashboard',
      submitFallbacks,
      { isSlowNetwork: this.isSlowNetwork, strategyTimeout: timeout }
    );

    if (capturePromise) {
      await capturePromise.catch(() => {});
    }
  }

  async verifyLoginRedirection(actor: Actor): Promise<void> {
    const page = actor.getPage();
    const { name } = this.siteConfig;
    const timeout = this.isSlowNetwork ? 90000 : 60000;

    console.log(`[LoginTask] Verifying login redirection for "${name}"...`);

    if (name === 'CD') {
      try {
        await page.waitForURL(/.*(\/search|\/auth\/search|\/dashboard).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
      } catch (err: any) {
        console.warn(`[CD URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
      }
    } else if (name === 'SCC') {
      try {
        await page.waitForURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
      } catch (err: any) {
        console.warn(`[SCC URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
      }
    } else {
      try {
        await page.waitForURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i, { timeout });
        await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
      } catch (err: any) {
        console.warn(`[${name} URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
        await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
      }
    }

    console.log(`✅ [LoginTask] Redirection verified for ${name} at URL: ${page.url()}`);
  }
}