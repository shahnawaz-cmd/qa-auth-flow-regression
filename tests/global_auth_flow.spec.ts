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
import { CaptureDashboardApiResponseTask } from '../tasks/CaptureDashboardApiResponseTask';

// Mandatory static emails for Forgot Password tests
const STATIC_EMAILS: { [key: string]: string } = {
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

        // STEP 1: Navigate & Generate User Credentials
        const { email, password, phone } = await test.step('Generate Credentials & Navigate to Signup', async () => {
          await page.goto(site.signupUrl, { waitUntil: 'domcontentloaded' });
          
          const emailTask = new EmailGenerator();
          const passwordTask = new PasswordGenerator();
          await actor.attemptsTo(emailTask);
          await actor.attemptsTo(passwordTask);

          let phoneNumber: string | undefined;
          if (supportsPhone) {
            const phoneTask = new PhoneNumberGenerator();
            await actor.attemptsTo(phoneTask);
            phoneNumber = phoneTask.getPhoneNumber();
          }

          return { 
            email: emailTask.getEmail(), 
            password: passwordTask.getPassword(), 
            phone: phoneNumber 
          };
        });

        // STEP 2: Perform Signup & Capture Dashboard API
        await test.step('Execute Signup & Verify Dashboard', async () => {
          const signupDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'signup');
          signupDashboardCapture.startListening(page);

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

          const signupTask = new SignupTask(email, password, site, phone);
          await actor.attemptsTo(signupTask);
          await signupTask.verifyDashboardRedirection(actor);
          await actor.attemptsTo(signupDashboardCapture);
          await capturePromise;
        });

        // STEP 3: Perform Logout
        await test.step('Perform Logout', async () => {
          await actor.attemptsTo(new LogoutTask());
        });

        // STEP 4: Perform Login & Verify Dashboard
        await test.step('Execute Login & Verify Dashboard', async () => {
          await page.goto(site.loginUrl, { waitUntil: 'domcontentloaded' });
          
          const loginDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'login');
          loginDashboardCapture.startListening(page);

          const loginTask = new LoginTask(email, password, site, testInfo);
          await actor.attemptsTo(loginTask);
          await loginTask.verifyLoginRedirection(actor);
          await actor.attemptsTo(loginDashboardCapture);
        });

      } finally {
        try {
          await page.close();
        } catch (e) {}
      }
    });

    // STEP 5: Forgot Password Test (Preserving mandatory STATIC_EMAILS)
    if (Object.keys(STATIC_EMAILS).includes(site.name)) {
      test(`Auth Forgot Password Test: ${site.name}`, { timeout: 120000 }, async ({ page }, testInfo) => {
        const actor = new Actor('User', page);
        const email = STATIC_EMAILS[site.name];

        try {
          await test.step(`Submit Forgot Password Request for ${site.name}`, async () => {
            const forgotTask = new ForgotPasswordTask(email, site, testInfo);
            await actor.attemptsTo(forgotTask);
          });
        } finally {
          try {
            await page.close();
          } catch (e) {}
        }
      });
    }
  }
});

