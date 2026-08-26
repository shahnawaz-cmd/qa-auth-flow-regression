const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const {
  SLACK_WEBHOOK_URL,
  GITHUB_SERVER = 'https://github.com',
  GITHUB_REPO,
  GITHUB_RUN,
  GITHUB_ACTOR,
  GITHUB_REF,
  GITHUB_EVENT,
  GITHUB_SHA_VAL,
  REPORT_URL,
  BATCH_ID
} = process.env;

let aiHealedInfo = null;
if (fs.existsSync('.ai-healed.json')) {
  try {
    aiHealedInfo = JSON.parse(fs.readFileSync('.ai-healed.json', 'utf8'));
  } catch (e) {}
}

const reportsDir = 'playwright-reports-merged';
let jsonFiles = [];

if (fs.existsSync('results.json')) {
  jsonFiles.push('results.json');
}
if (fs.existsSync('playwright-report/results.json')) {
  jsonFiles.push('playwright-report/results.json');
}

try {
  if (fs.existsSync(reportsDir)) {
    const folders = fs.readdirSync(reportsDir);
    for (const folder of folders) {
      const jsonPath = path.join(reportsDir, folder, 'results.json');
      if (fs.existsSync(jsonPath) && !jsonFiles.includes(jsonPath)) {
        jsonFiles.push(jsonPath);
      }
    }
  }
} catch (e) {
  console.error('Error reading reports directory:', e);
}

let passedCount = 0;
let failedCount = 0;
let flakyCount = 0;
let skippedCount = 0;
let totalRetries = 0;
const failedSpecs = [];
const flakySpecs = [];

if (jsonFiles.length === 0) {
  console.warn('⚠️ No result files found!');
} else {
  for (const file of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));

      const getAllSpecs = (suite) => {
        let specs = [];
        if (suite.specs) specs.push(...suite.specs);
        if (suite.suites) {
          for (const sub of suite.suites) {
            specs.push(...getAllSpecs(sub));
          }
        }
        return specs;
      };

      const allSpecs = [];
      if (data.suites) {
        for (const suite of data.suites) {
          allSpecs.push(...getAllSpecs(suite));
        }
      }

      allSpecs.forEach((spec) => {
        if (!spec.tests || spec.tests.length === 0) return;
        for (const testInst of spec.tests) {
          const attempts = testInst.results || [];
          if (attempts.length === 0) continue;

          totalRetries += Math.max(0, attempts.length - 1);

          const hasFailures = attempts.some(r => r.status === 'failed' || r.status === 'timedOut');
          const hasPass = attempts.some(r => r.status === 'passed');
          const isSkipped = attempts.every(r => r.status === 'skipped');

          let finalStatus = 'unknown';
          if (hasFailures && hasPass) {
            finalStatus = 'flaky';
          } else if (hasPass) {
            finalStatus = 'passed';
          } else if (isSkipped) {
            finalStatus = 'skipped';
          } else if (hasFailures) {
            finalStatus = 'failed';
          }

          const browser = testInst.projectName || 'default';

          if (finalStatus === 'flaky') {
            flakyCount++;
            flakySpecs.push({ title: spec.title, browser });
          } else if (finalStatus === 'passed') {
            passedCount++;
          } else if (finalStatus === 'skipped') {
            skippedCount++;
          } else if (finalStatus === 'failed') {
            failedCount++;
            const lastFailure = attempts.reverse().find(r => r.status === 'failed' || r.status === 'timedOut');
            let errorMsg = lastFailure?.error?.message ? lastFailure.error.message.split('\n')[0].substring(0, 150) : 'Unknown error';
            failedSpecs.push({ title: spec.title, browser, error: errorMsg });
          }
        }
      });
    } catch (e) {
      console.error(`Error parsing ${file}:`, e);
    }
  }
}

const totalTests = passedCount + failedCount + flakyCount + skippedCount;
const isSuccess = failedCount === 0 && (passedCount > 0 || flakyCount > 0);
const statusEmoji = isSuccess ? '✅' : '❌';
const statusText = isSuccess ? (aiHealedInfo?.healed ? 'Passed (AI Auto-Healed 🤖)' : 'Passed') : 'Failed';
const barColor = isSuccess ? '#2EB67D' : '#E01E5A';

// Build grouped test summary
let summaryParts = [];
if (failedSpecs.length > 0) {
  summaryParts.push(`*🔴 Failed Tests (${failedSpecs.length}):*\n` + failedSpecs.map(s => `• *${s.title}* (_${s.browser}_)\n    > ❌ \`${s.error}\``).join('\n'));
}
if (flakySpecs.length > 0) {
  summaryParts.push(`*🟡 Flaky Tests (Passed on Retry) (${flakySpecs.length}):*\n` + flakySpecs.map(s => `• *${s.title}* (_${s.browser}_)`).join('\n'));
}
summaryParts.push(`*🟢 Passed Tests:* \`${passedCount}\` specs completed successfully.`);

if (aiHealedInfo && aiHealedInfo.healed) {
  summaryParts.push(`*🤖 AI Agentic Self-Healer Status:* ✨ *Auto-Repaired via Gemini AI (${aiHealedInfo.model})*\n• *Files Auto-Healed:* \`${aiHealedInfo.repairedFiles.join('`, `')}\``);
}

const testSummary = summaryParts.join('\n\n');

const runUrl = (GITHUB_REPO && GITHUB_RUN) ? `${GITHUB_SERVER}/${GITHUB_REPO}/actions/runs/${GITHUB_RUN}` : '';
const reportUrl = REPORT_URL || (GITHUB_REPO ? `https://${GITHUB_REPO.split('/')[0]}.github.io/${GITHUB_REPO.split('/')[1]}/` : '');

const payload = {
  text: `${statusEmoji} Global Auth Flow Monitoring – ${statusText}`,
  attachments: [
    {
      color: barColor,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${statusEmoji} qa-auth-flow-orchestrator (${GITHUB_EVENT === 'schedule' ? 'Scheduled Run' : 'Push/Manual Run'})`,
            emoji: true
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Status:* ${statusEmoji} *${statusText}*\n*Total Tests:* \`${totalTests}\` | *Passed:* \`${passedCount}\` | *Failed:* \`${failedCount}\` | *Flaky:* \`${flakyCount}\` | *Skipped:* \`${skippedCount}\` | *Retries:* \`${totalRetries}\``
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Suite:* \`Global Authentication Flows (Signup, Login, Forgot Password across 30+ Sites)\`\n` +
                  (runUrl ? `*Workflow Run:* <${runUrl}|View Workflow Run 🛠️>\n` : '') +
                  (reportUrl ? `*HTML Report:* <${reportUrl}|View Public HTML Report 📊>\n` : '') +
                  `*Trigger Details:* \`${GITHUB_ACTOR || 'N/A'}\` via \`${GITHUB_EVENT || 'N/A'}\` (\`${GITHUB_REF || 'N/A'}\`)` +
                  (GITHUB_SHA_VAL ? `\n*Commit:* \`${GITHUB_SHA_VAL.substring(0, 7)}\`` : '')
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Test Summary:*\n${testSummary}`
          }
        }
      ]
    }
  ]
};

const payloadString = JSON.stringify(payload, null, 2);

if (!SLACK_WEBHOOK_URL || SLACK_WEBHOOK_URL === 'local') {
  console.log('SLACK_WEBHOOK_URL is not set or set to local. Printing payload:');
  console.log(payloadString);
  process.exit(0);
}

const webhookUrl = new url.URL(SLACK_WEBHOOK_URL);

const options = {
  hostname: webhookUrl.hostname,
  port: 443,
  path: webhookUrl.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payloadString)
  }
};

const req = https.request(options, (res) => {
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error('Error sending slack notification:', e);
});

req.write(payloadString);
req.end();
