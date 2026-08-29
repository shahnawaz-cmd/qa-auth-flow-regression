import { test, expect } from '@playwright/test';
import { Actor } from '../actors/Actor';
import { SITE_CONFIGS } from '../actions/siteConfigs';
import { EmailGenerator } from '../tasks/EmailGenerator';
import { PasswordGenerator } from '../tasks/PasswordGenerator';
import { PhoneNumberGenerator } from '../tasks/PhoneNumberGenerator';
import { SignupTask } from '../tasks/SignupTask';
import { LoginTask } from '../tasks/LoginTask';
import { LogoutTask } from '../tasks/LogoutTask';
import { ForgotPasswordTask } from '../tasks/ForgotPasswordTask';
import { DismissPopupTask } from '../tasks/DismissPopupTask';
import { CaptureDashboardApiResponseTask } from '../tasks/CaptureDashboardApiResponseTask';

test.describe('Global Signup & Login Tests', () => {

  const siteName = process.env.SITE_NAME;
  const batchId = process.env.BATCH_ID ? parseInt(process.env.BATCH_ID) : null;
  const sites = Object.values(SITE_CONFIGS).filter(s => {
    if (siteName) return s.name === siteName;
    if (batchId) return s.batch === batchId;
    return true;
  });

  for (const site of sites) {
    test(`Auth Signup Test: ${site.name}`, { timeout: 120000 }, async ({ page }, testInfo) => {
        const actor = new Actor('User', page);
        try {
            const supportsPhone = site.name !== 'SCC';
            await page.goto(site.signupUrl, { waitUntil: 'domcontentloaded' });
      
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

            // Setup Dashboard API listener for Signup
            const signupDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'signup');
            signupDashboardCapture.startListening(page);

            // Setup API capture
            const capturePromise = page.waitForResponse(
              (response) => response.url().includes(site.apiEndpoint) && response.request().method() === 'POST',
              { timeout: 60000 }
            ).then(async (response) => {
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
                  responseBody: await response.json().catch(() => ({})),
                  status: response.status()
                };
                await testInfo.attach('signup-api-response', {
                  body: JSON.stringify(data, null, 2),
                  contentType: 'application/json',
                });
            }).catch(e => console.warn(`[${site.name}] API capture note:`, e.message));
            
            // Perform Signup
            const signupTask = new SignupTask(email, password, site, phone);
            await actor.attemptsTo(signupTask);
            await signupTask.verifyDashboardRedirection(actor);

            // Verify Dashboard RSC/API Response & Capture Dashboard Screenshot for Signup
            await actor.attemptsTo(signupDashboardCapture);

            await capturePromise;

            // Perform Logout & Login
            await actor.attemptsTo(new LogoutTask());
            await page.goto(site.loginUrl, { waitUntil: 'domcontentloaded' });

            // Setup Dashboard API listener for Login
            const loginDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'login');
            loginDashboardCapture.startListening(page);

            const loginTask = new LoginTask(email, password, site, testInfo);
            await actor.attemptsTo(loginTask);
            await loginTask.verifyLoginRedirection(actor);

            // Verify Dashboard RSC/API Response & Capture Dashboard Screenshot for Login
            await actor.attemptsTo(loginDashboardCapture);
        } finally {
            try {
                await page.close();
            } catch (e) {}
        }
      });

      if (['SCC', 'DVH', 'CD', 'HONDA', 'GMC', 'HYUNDAI', 'INFINITI', 'VSR', 'PORSCHE', 'RAM', 'MERCEDES', 'MOTORCYCLEVIN', 'VINNUMBER_CA', 'VEHICLEHISTORY_EU', 'INSTANTVINREPORTS'].includes(site.name)) {
        test(`Auth Forgot Password Test: ${site.name}`, { timeout: 120000 }, async ({ page }, testInfo) => {
          const actor = new Actor('User', page);
          
          const staticEmails: { [key: string]: string } = {
              'SCC': 'shahnawaz+rok0@empirepixel.com',
              'DVH': 'shahnawaz+sxqx@empirepixel.com',
              'CD': 'shahnawaz+00q6@empirepixel.com',
              'HONDA': 'shahnawaz+g9qx@empirepixel.com',
              'GMC': 'shahnawaz+gmc@empirepixel.com',
              'HYUNDAI': 'shahnawaz+hyu@empirepixel.com',
              'INFINITI': 'shahnawaz+inf@empirepixel.com',
              'VSR': 'shahnawaz+vsr@empirepixel.com',
              'PORSCHE': 'shahnawaz+por@empirepixel.com',
              'RAM': 'shahnawaz+ram@empirepixel.com',
              'MERCEDES': 'shahnawaz+jlas@empirepixel.com',
              'MOTORCYCLEVIN': 'shahnawaz+mc@empirepixel.com',
              'VINNUMBER_CA': 'shahnawaz+ucd7@empirepixel.com',
              'VEHICLEHISTORY_EU': 'shahnawaz+69ns@empirepixel.com',
              'INSTANTVINREPORTS': 'shahnawaz+w0si@empirepixel.com'
          };

          const email = staticEmails[site.name];
          try {
              const forgotTask = new ForgotPasswordTask(email, site, testInfo);
              await actor.attemptsTo(forgotTask);
          } finally {
              try {
                await page.close();
              } catch (e) {}
          }
        });
      }
  }
});
