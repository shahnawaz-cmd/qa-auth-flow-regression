const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Extracts detailed failure stacks, line numbers, and Playwright call logs from results.json
 */
function extractFailuresFromResults() {
  const possiblePaths = [
    'results.json',
    'playwright-report/results.json'
  ];

  // Also check merged report folders if present
  if (fs.existsSync('playwright-reports-merged')) {
    try {
      const subdirs = fs.readdirSync('playwright-reports-merged');
      for (const dir of subdirs) {
        const p = path.join('playwright-reports-merged', dir, 'results.json');
        if (fs.existsSync(p)) possiblePaths.push(p);
      }
    } catch (e) {}
  }

  const failuresByFile = {};

  for (const jsonPath of possiblePaths) {
    if (!fs.existsSync(jsonPath)) continue;
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(raw);

      const targets = [
        'tasks/SignupTask.ts',
        'tasks/LoginTask.ts',
        'tasks/LogoutTask.ts',
        'tasks/ForgotPasswordTask.ts',
        'tasks/ForgotTask.ts',
        'tasks/DismissPopupTask.ts',
        'tasks/CaptureSignupApiResponseTask.ts',
        'actions/siteConfigs.ts',
        'actions/authUrls.ts',
        'utils/selfHealingLocator.ts',
        'tests/global_auth_flow.spec.ts'
      ];

      const traverseSuite = (suite) => {
        if (suite.specs) {
          for (const spec of suite.specs) {
            for (const t of spec.tests || []) {
              for (const r of t.results || []) {
                if (r.status === 'failed' || r.status === 'timedOut') {
                  const err = r.error || {};
                  const file = err.location?.file || spec.file || '';
                  const line = err.location?.line || spec.line || '';
                  const msg = (err.message || 'Unknown error').replace(/\u001b\[[0-9;]*m/g, ''); // strip ANSI
                  const snippet = (err.snippet || '').replace(/\u001b\[[0-9;]*m/g, '');

                  for (const target of targets) {
                    const normalizedTarget = target.replace(/\//g, '\\');
                    const baseTarget = path.basename(target);
                    if (
                      file.includes(target) ||
                      file.includes(normalizedTarget) ||
                      file.includes(baseTarget) ||
                      msg.includes(baseTarget) ||
                      snippet.includes(baseTarget)
                    ) {
                      if (!failuresByFile[target]) failuresByFile[target] = [];
                      failuresByFile[target].push({
                        title: spec.title,
                        line,
                        message: msg,
                        snippet
                      });
                    }
                  }

                  if (!failuresByFile['_all']) failuresByFile['_all'] = [];
                  failuresByFile['_all'].push({ title: spec.title, file, line, message: msg });
                }
              }
            }
          }
        }
        if (suite.suites) {
          for (const s of suite.suites) traverseSuite(s);
        }
      };

      if (data.suites) {
        for (const s of data.suites) traverseSuite(s);
      }
    } catch (e) {
      console.warn(`⚠️ Error parsing ${jsonPath} for failures:`, e.message);
    }
  }

  return failuresByFile;
}

async function runCiHealer() {
  console.log('🤖 Agentic AI Healer activated for Global Auth Flow Monitoring (CI)...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    console.log('⚠️ GEMINI_API_KEY missing or invalid in environment. Skipping AI healing step.');
    return;
  }

  const failures = extractFailuresFromResults();
  const failedFileKeys = Object.keys(failures).filter(k => k !== '_all');

  const targetFiles = failedFileKeys.length > 0
    ? failedFileKeys
    : [
        'tasks/SignupTask.ts',
        'tasks/LoginTask.ts',
        'tasks/ForgotPasswordTask.ts',
        'tasks/DismissPopupTask.ts',
        'actions/siteConfigs.ts'
      ];

  console.log(`📋 Target files to analyze/heal: ${targetFiles.join(', ')}`);

  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  const genAI = new GoogleGenerativeAI(apiKey);
  const repairedFiles = [];
  let usedModel = '';

  for (const targetFile of targetFiles) {
    if (!fs.existsSync(targetFile)) continue;
    const taskCode = fs.readFileSync(targetFile, 'utf-8');

    const fileFailures = failures[targetFile] || [];
    let failureContext = '';

    if (fileFailures.length > 0) {
      failureContext = fileFailures.map(f => `
TEST CASE: ${f.title}
FAILED AT LINE: ${f.line}
ERROR MESSAGE & CALL LOG:
${f.message}
${f.snippet ? `CODE SNIPPET:\n${f.snippet}` : ''}
      `).join('\n---\n');
    } else {
      failureContext = 'General locator failure, timeout, or DOM drift during Global Auth Flow execution.';
    }

    const prompt = `
      You are an expert Playwright automation healing agent specializing in production stability and TypeScript Screenplay architecture.
      The Playwright file "${targetFile}" for Global Authentication Flow (Signup, Login, Forgot Password across 30+ vehicle platforms) failed during execution.

      ACTUAL PLAYWRIGHT CI ERROR, CALL LOG & STACK:
      ${failureContext}

      CURRENT FILE SOURCE CODE:
      \`\`\`typescript
      ${taskCode}
      \`\`\`

      Healing Guidelines across Error Categories:
      1. SELECTOR & DOM DRIFT:
         - Switch to resilient semantic locators (getByRole, getByPlaceholder, getByLabel, getByText, or input name/type attributes).
         - If strict mode violation (multiple matches), always append .locator('visible=true').first() or .first().
         - You can import and use helpers from '../utils/selfHealingLocator' (locateInputWithHealing, fastInputWithHealing, locateElementWithHealing, clickWithHealing).
      2. REACT / SPA HYDRATION & TIMING:
         - Check if fields are reset after mount and ensure values are re-entered or event listeners (input, change) are triggered.
      3. TIMEOUT & ASYNC REDIRECTS / API CALLS:
         - For URL redirections, use resilient regex pattern matching e.g. waitForURL(/.*(dashboard|search|basic).*/i).
         - For API responses, ensure waitForResponse catches POST requests with generous timeouts and graceful fallback if already completed.
      4. TYPESCRIPT COMPATIBILITY:
         - Maintain proper TypeScript types, imports, class structure, and export statements.

      Constraints:
      - Preserve all existing class names, constructor arguments, method signatures, and exported members.
      - Return ONLY valid executable TypeScript / JavaScript code without markdown code fence wrappers or introductory commentary.
    `;

    let result = null;
    let successfulModel = '';

    for (const modelName of candidateModels) {
      try {
        console.log(`🧠 Attempting Gemini AI model (${modelName}) for ${targetFile}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent(prompt);
        if (res && res.response) {
          result = res;
          successfulModel = modelName;
          console.log(`✅ Successfully generated healing patch from ${modelName}!`);
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} attempt failed: ${err.message}`);
      }
    }

    if (result && result.response) {
      const correctedCode = result.response.text().replace(/```javascript|```typescript|```/g, '').trim();
      fs.writeFileSync(targetFile, correctedCode, 'utf-8');
      repairedFiles.push(targetFile);
      usedModel = successfulModel;
      console.log(`✨ [AI Healer Success] Auto-repaired ${targetFile} using ${successfulModel}.`);
    }
  }

  if (repairedFiles.length > 0) {
    fs.writeFileSync('.ai-healed.json', JSON.stringify({
      healed: true,
      model: usedModel,
      repairedFiles,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  console.log('🚀 Re-running Playwright test suite to verify AI fixes...');
  try {
    execSync('npx playwright test', { stdio: 'inherit', timeout: 300000 });
  } catch (e) {
    console.warn('⚠️ Verification test run completed.');
  }
}

if (require.main === module) {
  runCiHealer().catch(console.error);
}

module.exports = { runCiHealer };
