import { test, expect } from '@playwright/test';
import { Actor } from '../actors/Actor';
import { SITE_CONFIGS } from '../actions/siteConfigs';
import { EmailGenerator } from '../tasks/EmailGenerator';
import { PasswordGenerator } from '../tasks/PasswordGenerator';
import { PhoneNumberGenerator } from '../tasks/PhoneNumberGenerator';
import { SignupTask } from '../tasks/SignupTask';
import { LoginTask } from '../tasks/LoginTask';
import { LogoutTask } from '../tasks/LogoutTask';
import { ForgotTask } from '../tasks/ForgotTask';
import { CaptureSignupApiResponseTask } from '../tasks/CaptureSignupApiResponseTask';

test.describe('Global Signup & Login Tests', () => {

  const batchId = process.env.BATCH_ID ? parseInt(process.env.BATCH_ID) : null;
  const sites = Object.values(SITE_CONFIGS).filter(s => !batchId || s.batch === batchId);

  for (const site of sites) {
    test(`Global Signup Test: ${site.name}`, { timeout: 60000 }, async ({ page }, testInfo) => {
        const actor = new Actor('User', page);
        try {
            // Include phone for all sites except SCC
            const supportsPhone = site.name !== 'SCC';
            await page.goto(site.signupUrl);
      
            const emailTask = new EmailGenerator();
            const passwordTask = new PasswordGenerator();
            await actor.attemptsTo(emailTask);
            await actor.attemptsTo(passwordTask);
      
            const email = emailTask.getEmail();
            const password = passwordTask.getPassword();
            let phone: string | undefined;

            if (supportsPhone) {
                const phoneTask = new PhoneNumberGenerator();
                await actor.attemptsTo(phoneTask);
                phone = phoneTask.getPhoneNumber();
            }

            // Setup API capture
            const capturePromise = page.waitForResponse(
              (response) => response.url().includes(site.apiEndpoint) && response.request().method() === 'POST'
            ).then(async (response) => {
                console.log('API response captured for signup');
                const request = response.request();
                const rawPayload = request.postData() || '{}';
                let parsedPayload;
                try {
                  parsedPayload = JSON.parse(rawPayload);
                } catch (e) {
                  parsedPayload = { raw: rawPayload };
                }
                const data = {
                  url: response.url(),
                  requestPayload: parsedPayload,
                  responseBody: await response.json(),
                  status: response.status()
                };
                await testInfo.attach('signup-api-response', {
                  body: JSON.stringify(data, null, 2),
                  contentType: 'application/json',
                });
            });
            
            // Perform Signup
            const signupTask = new SignupTask(email, password, site, phone);
            await actor.attemptsTo(signupTask);
            await signupTask.verifyDashboardRedirection(actor);

            await capturePromise; // Ensure we finish capturing

            // Perform Logout & Login
            await actor.attemptsTo(new LogoutTask());
            await page.goto(site.loginUrl);
            const loginTask = new LoginTask(email, password, site, testInfo);
            await actor.attemptsTo(loginTask);
            await loginTask.verifyLoginRedirection(actor);

            // Perform Forgot Password
            await actor.attemptsTo(new ForgotTask(email, site, testInfo));
        } finally {
            console.log(`Cleaning up: ${site.name}`);
            try {
                await page.close();
            } catch (e) {
                console.error(`Error closing page for ${site.name}:`, e);
            }
        }
      });
  }
});

