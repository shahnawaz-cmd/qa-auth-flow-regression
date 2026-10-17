# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global_auth_flow.spec.ts >> Global Signup & Login Tests >> Auth Signup Test: KIA
- Location: tests/global_auth_flow.spec.ts:43:9

# Error details

```
TimeoutError: page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "https://kiawindowsticker.com/signup", waiting until "domcontentloaded"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { Actor } from '../actors/Actor';
  3   | import { SITE_CONFIGS } from '../actions/siteConfigs';
  4   | import { EmailGenerator } from '../tasks/EmailGenerator';
  5   | import { PasswordGenerator } from '../tasks/PasswordGenerator';
  6   | import { PhoneNumberGenerator } from '../tasks/PhoneNumberGenerator';
  7   | import { SignupTask } from '../tasks/SignupTask';
  8   | import { LoginTask } from '../tasks/LoginTask';
  9   | import { LogoutTask } from '../tasks/LogoutTask';
  10  | import { ForgotPasswordTask } from '../tasks/ForgotPasswordTask';
  11  | import { CaptureDashboardApiResponseTask } from '../tasks/CaptureDashboardApiResponseTask';
  12  | 
  13  | // Mandatory static emails for Forgot Password tests
  14  | const STATIC_EMAILS: { [key: string]: string } = {
  15  |   'SCC': 'shahnawaz+rok0@empirepixel.com',
  16  |   'DVH': 'shahnawaz+sxqx@empirepixel.com',
  17  |   'CD': 'shahnawaz+00q6@empirepixel.com',
  18  |   'HONDA': 'shahnawaz+g9qx@empirepixel.com',
  19  |   'GMC': 'shahnawaz+gmc@empirepixel.com',
  20  |   'HYUNDAI': 'shahnawaz+hyu@empirepixel.com',
  21  |   'INFINITI': 'shahnawaz+inf@empirepixel.com',
  22  |   'VSR': 'shahnawaz+vsr@empirepixel.com',
  23  |   'PORSCHE': 'shahnawaz+por@empirepixel.com',
  24  |   'RAM': 'shahnawaz+ram@empirepixel.com',
  25  |   'MERCEDES': 'shahnawaz+jlas@empirepixel.com',
  26  |   'MOTORCYCLEVIN': 'shahnawaz+mc@empirepixel.com',
  27  |   'VINNUMBER_CA': 'shahnawaz+ucd7@empirepixel.com',
  28  |   'VEHICLEHISTORY_EU': 'shahnawaz+69ns@empirepixel.com',
  29  |   'INSTANTVINREPORTS': 'shahnawaz+w0si@empirepixel.com'
  30  | };
  31  | 
  32  | test.describe('Global Signup & Login Tests', () => {
  33  | 
  34  |   const siteName = process.env.SITE_NAME;
  35  |   const batchId = process.env.BATCH_ID ? parseInt(process.env.BATCH_ID) : null;
  36  |   const sites = Object.values(SITE_CONFIGS).filter(s => {
  37  |     if (siteName) return s.name === siteName;
  38  |     if (batchId) return s.batch === batchId;
  39  |     return true;
  40  |   });
  41  | 
  42  |   for (const site of sites) {
  43  |     test(`Auth Signup Test: ${site.name}`, { timeout: 120000 }, async ({ page }, testInfo) => {
  44  |       const actor = new Actor('User', page);
  45  |       try {
  46  |         const supportsPhone = site.name !== 'SCC';
  47  | 
  48  |         // STEP 1: Navigate & Generate User Credentials
  49  |         const { email, password, phone } = await test.step('Generate Credentials & Navigate to Signup', async () => {
> 50  |           await page.goto(site.signupUrl, { waitUntil: 'domcontentloaded' });
      |                      ^ TimeoutError: page.goto: Timeout 60000ms exceeded.
  51  |           
  52  |           const emailTask = new EmailGenerator();
  53  |           const passwordTask = new PasswordGenerator();
  54  |           await actor.attemptsTo(emailTask);
  55  |           await actor.attemptsTo(passwordTask);
  56  | 
  57  |           let phoneNumber: string | undefined;
  58  |           if (supportsPhone) {
  59  |             const phoneTask = new PhoneNumberGenerator();
  60  |             await actor.attemptsTo(phoneTask);
  61  |             phoneNumber = phoneTask.getPhoneNumber();
  62  |           }
  63  | 
  64  |           return { 
  65  |             email: emailTask.getEmail(), 
  66  |             password: passwordTask.getPassword(), 
  67  |             phone: phoneNumber 
  68  |           };
  69  |         });
  70  | 
  71  |         // STEP 2: Perform Signup & Capture Dashboard API
  72  |         await test.step('Execute Signup & Verify Dashboard', async () => {
  73  |           const signupDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'signup');
  74  |           signupDashboardCapture.startListening(page);
  75  | 
  76  |           const capturePromise = page.waitForResponse(
  77  |             (response) => response.url().includes(site.apiEndpoint) && response.request().method() === 'POST',
  78  |             { timeout: 60000 }
  79  |           ).then(async (response) => {
  80  |             const request = response.request();
  81  |             const rawPayload = request.postData() || '{}';
  82  |             let parsedPayload;
  83  |             try {
  84  |               parsedPayload = JSON.parse(rawPayload);
  85  |             } catch (e) {
  86  |               parsedPayload = { raw: rawPayload };
  87  |             }
  88  |             const data = {
  89  |               url: response.url(),
  90  |               requestPayload: parsedPayload,
  91  |               responseBody: await response.json().catch(() => ({})),
  92  |               status: response.status()
  93  |             };
  94  |             await testInfo.attach('signup-api-response', {
  95  |               body: JSON.stringify(data, null, 2),
  96  |               contentType: 'application/json',
  97  |             });
  98  |           }).catch(e => console.warn(`[${site.name}] API capture note:`, e.message));
  99  | 
  100 |           const signupTask = new SignupTask(email, password, site, phone);
  101 |           await actor.attemptsTo(signupTask);
  102 |           await signupTask.verifyDashboardRedirection(actor);
  103 |           await actor.attemptsTo(signupDashboardCapture);
  104 |           await capturePromise;
  105 |         });
  106 | 
  107 |         // STEP 3: Perform Logout
  108 |         await test.step('Perform Logout', async () => {
  109 |           await actor.attemptsTo(new LogoutTask());
  110 |         });
  111 | 
  112 |         // STEP 4: Perform Login & Verify Dashboard
  113 |         await test.step('Execute Login & Verify Dashboard', async () => {
  114 |           await page.goto(site.loginUrl, { waitUntil: 'domcontentloaded' });
  115 |           
  116 |           const loginDashboardCapture = new CaptureDashboardApiResponseTask(site, testInfo, 'login');
  117 |           loginDashboardCapture.startListening(page);
  118 | 
  119 |           const loginTask = new LoginTask(email, password, site, testInfo);
  120 |           await actor.attemptsTo(loginTask);
  121 |           await loginTask.verifyLoginRedirection(actor);
  122 |           await actor.attemptsTo(loginDashboardCapture);
  123 |         });
  124 | 
  125 |       } finally {
  126 |         try {
  127 |           await page.close();
  128 |         } catch (e) {}
  129 |       }
  130 |     });
  131 | 
  132 |     // STEP 5: Forgot Password Test (Preserving mandatory STATIC_EMAILS)
  133 |     if (Object.keys(STATIC_EMAILS).includes(site.name)) {
  134 |       test(`Auth Forgot Password Test: ${site.name}`, { timeout: 120000 }, async ({ page }, testInfo) => {
  135 |         const actor = new Actor('User', page);
  136 |         const email = STATIC_EMAILS[site.name];
  137 | 
  138 |         try {
  139 |           await test.step(`Submit Forgot Password Request for ${site.name}`, async () => {
  140 |             const forgotTask = new ForgotPasswordTask(email, site, testInfo);
  141 |             await actor.attemptsTo(forgotTask);
  142 |           });
  143 |         } finally {
  144 |           try {
  145 |             await page.close();
  146 |           } catch (e) {}
  147 |         }
  148 |       });
  149 |     }
  150 |   }
```