# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: global_auth_flow.spec.ts >> Global Signup & Login Tests >> Auth Signup Test: HONDA
- Location: tests/global_auth_flow.spec.ts:25:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i
Received string:  "https://hondawindowsticker.com/signup?email=shahnawaz%2Bhimi%40empirepixel.com&password=8r%25*%24TUwbayq&confirmPassword=8r%25*%24TUwbayq&phone=9186057267"
Timeout: 30000ms

Call log:
  - Expect "toHaveURL" with timeout 30000ms
    63 × unexpected value "https://hondawindowsticker.com/signup?email=shahnawaz%2Bhimi%40empirepixel.com&password=8r%25*%24TUwbayq&confirmPassword=8r%25*%24TUwbayq&phone=9186057267"

```

```yaml
- region "Notifications (F8)":
  - list
- img "Site logo"
- paragraph: Access VIN and plate decoding, history reports, window stickers, recall checks, maintenance insights, and order management. All in one streamlined dashboard.
- heading "Create Account" [level=1]
- paragraph: Join us and start your journey
- img
- text: Email Address
- textbox "Email Address":
  - /placeholder: Enter your email
- img
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
- button:
  - img
- img
- text: Confirm Password
- textbox "Confirm Password":
  - /placeholder: Confirm your password
- button:
  - img
- img
- text: Phone (Optional)
- textbox "Phone (Optional)":
  - /placeholder: Enter your phone number
- button "Create Account"
- text: Already have an account?
- link "Sign in":
  - /url: /login
- region "Notifications Alt+T"
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  83  |       );
  84  |       if (await confirmInput.isVisible({ timeout: 1500 })) {
  85  |         await confirmInput.fill(this.password);
  86  |         await confirmInput.dispatchEvent('input').catch(() => {});
  87  |         await confirmInput.dispatchEvent('change').catch(() => {});
  88  |       }
  89  |     } catch (e) {}
  90  | 
  91  |     // 4. Phone Number Input (if provided / supported)
  92  |     if (this.phoneNumber) {
  93  |       const phoneFallbacks = [
  94  |         ...(selectors?.phone ? [selectors.phone] : []),
  95  |         'input[name="phone"]',
  96  |         'input[type="tel"]',
  97  |         'input[placeholder*="phone" i]'
  98  |       ];
  99  | 
  100 |       try {
  101 |         const phoneInput = await locateInputWithHealing(
  102 |           page,
  103 |           'phone',
  104 |           phoneFallbacks,
  105 |           { isSlowNetwork: this.isSlowNetwork, timeout: 3000, strategyTimeout: 1500 }
  106 |         );
  107 |         if (await phoneInput.isVisible({ timeout: 1500 })) {
  108 |           await phoneInput.fill(this.phoneNumber);
  109 |           await phoneInput.dispatchEvent('input').catch(() => {});
  110 |           await phoneInput.dispatchEvent('change').catch(() => {});
  111 |         }
  112 |       } catch (e) {}
  113 |     }
  114 | 
  115 |     // 5. Adaptive Terms & Conditions Checkbox (if present)
  116 |     await acceptTermsCheckbox(page, 3000);
  117 | 
  118 |     // 🛡️ Pre-Submit Hydration Protection: Verify inputs didn't get cleared by React
  119 |     const finalEmailVal = await emailInput.inputValue().catch(() => '');
  120 |     if (!finalEmailVal || finalEmailVal !== this.email) {
  121 |       console.log(`[Self-Healing] React hydration reset detected on ${name} before submit. Re-filling Email...`);
  122 |       await emailInput.click();
  123 |       await emailInput.fill(this.email);
  124 |       await emailInput.dispatchEvent('input').catch(() => {});
  125 |       await emailInput.dispatchEvent('change').catch(() => {});
  126 |     }
  127 | 
  128 |     const finalPassVal = await passwordInput.inputValue().catch(() => '');
  129 |     if (!finalPassVal || finalPassVal !== this.password) {
  130 |       console.log(`[Self-Healing] React hydration reset detected on ${name} before submit. Re-filling Password...`);
  131 |       await passwordInput.click();
  132 |       await passwordInput.fill(this.password);
  133 |       await passwordInput.dispatchEvent('input').catch(() => {});
  134 |       await passwordInput.dispatchEvent('change').catch(() => {});
  135 |     }
  136 | 
  137 |     // 6. Resilient Submit Button
  138 |     const submitFallbacks = [
  139 |       ...(selectors?.submit ? [selectors.submit] : []),
  140 |       'button[type="submit"]',
  141 |       'button:has-text("Create Account")',
  142 |       'button:has-text("Sign up")',
  143 |       'button:has-text("Submit")'
  144 |     ];
  145 | 
  146 |     await clickWithHealing(
  147 |       page,
  148 |       'Create Account',
  149 |       submitFallbacks,
  150 |       { isSlowNetwork: this.isSlowNetwork, strategyTimeout: 5000 }
  151 |     );
  152 |   }
  153 | 
  154 |   async verifyDashboardRedirection(actor: Actor): Promise<void> {
  155 |     const page = actor.getPage();
  156 |     const { name } = this.siteConfig;
  157 |     const timeout = this.isSlowNetwork ? 90000 : 60000;
  158 | 
  159 |     console.log(`[SignupTask] Verifying dashboard redirection for "${name}"...`);
  160 | 
  161 |     if (name === 'CD') {
  162 |       try {
  163 |         await page.waitForURL(/.*(\/search|\/auth\/search|\/dashboard).*/i, { timeout });
  164 |         await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
  165 |       } catch (err: any) {
  166 |         console.warn(`[CD URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
  167 |         await expect(page).toHaveURL(/.*(\/search|\/auth\/search|\/dashboard).*/i);
  168 |       }
  169 |     } else if (name === 'SCC') {
  170 |       try {
  171 |         await page.waitForURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i, { timeout });
  172 |         await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
  173 |       } catch (err: any) {
  174 |         console.warn(`[SCC URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
  175 |         await expect(page).toHaveURL(/.*(\/dashboard\?type=basic|\/members\/dashboard|\/dashboard).*/i);
  176 |       }
  177 |     } else {
  178 |       try {
  179 |         await page.waitForURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i, { timeout });
  180 |         await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
  181 |       } catch (err: any) {
  182 |         console.warn(`[${name} URL warning] Current URL: ${page.url()} - Error: ${err.message}`);
> 183 |         await expect(page).toHaveURL(/.*(\/dashboard|\/members\/dashboard|\/search|\/home).*/i);
      |                            ^ Error: expect(page).toHaveURL(expected) failed
  184 |       }
  185 |     }
  186 | 
  187 |     console.log(`✅ [SignupTask] Dashboard verified for ${name} at URL: ${page.url()}`);
  188 |   }
  189 | }
```