import { test, expect } from '@playwright/test';
import { Actor } from '../actors/Actor';
import { SITE_CONFIGS } from '../actions/siteConfigs';
import { EmailGenerator } from '../tasks/EmailGenerator';
import { PasswordGenerator } from '../tasks/PasswordGenerator';
import { PhoneNumberGenerator } from '../tasks/PhoneNumberGenerator';
import { SignupTask } from '../tasks/SignupTask';
import { LoginTask } from '../tasks/LoginTask';
import { LogoutTask } from '../tasks/LogoutTask';
import { CaptureSignupApiResponseTask } from '../tasks/CaptureSignupApiResponseTask';
import { ForgotPasswordTask } from '../tasks/ForgotPasswordTask';

test.describe('Global Signup & Login Tests', () => {

  const batchId = process.env.BATCH_ID ? parseInt(process.env.BATCH_ID) : null;
  const sites = Object.values(SITE_CONFIGS).filter(s => !batchId || s.batch === batchId);

  for (const site of sites) {
    test(`Auth Signup Test: ${site.name}`, { timeout: 60000 }, async ({ page }, testInfo) => {
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
        } finally {
            console.log(`Cleaning up: ${site.name}`);
            try {
                await page.close();
            } catch (e) {
                console.error(`Error closing page for ${site.name}:`, e);
            }
        }
      });

      if (['SCC', 'DVH', 'CD', 'HONDA', 'GMC', 'HYUNDAI', 'INFINITI', 'VSR', 'PORSCHE', 'RAM', 'MERCEDES', 'MOTORCYCLEVIN', 'VINNUMBER_CA', 'VEHICLEHISTORY_EU', 'INSTANTVINREPORTS'].includes(site.name)) {
        test(`Auth Forgot Password Test: ${site.name}`, { timeout: 60000 }, async ({ page }, testInfo) => {
          const actor = new Actor('User', page);
          
          // Define static emails based on site
          const staticEmails: { [key: string]: string } = {
              'SCC': 'testuser_1784906831078@example.com',
              'DVH': 'testuser_1784906797109@example.com',
              'CD': 'testuser_1784906878764@example.com',
              'HONDA': 'testuser_1784906903391@example.com',
              'GMC': 'testuser_1784906855212@example.com',
              'HYUNDAI': 'testuser_1784901879764@example.com',
              'INFINITI': 'testuser_1784901984409@example.com',
              'VSR': 'testuser_1784901422499@example.com',
              'PORSCHE': 'testuser_1784909356852@example.com',
              'RAM': 'testuser_1784909364698@example.com',
              'MERCEDES': 'testuser_1784909331162@example.com',
              'MOTORCYCLEVIN': 'testuser_1784909241462@example.com',
              'VINNUMBER_CA': 'testuser_1784909248783@example.com',
              'VEHICLEHISTORY_EU': 'testuser_1784909235749@example.com',
              'INSTANTVINREPORTS': 'testuser_1784910336086@example.com'
          };

          const email = staticEmails[site.name];
          try {
              const forgotTask = new ForgotPasswordTask(email, site, testInfo);
              await actor.attemptsTo(forgotTask);
              console.log(`Forgot password flow completed for: ${site.name}`);
          } finally {
              await page.close();
          }
        });
      }
  }
});

