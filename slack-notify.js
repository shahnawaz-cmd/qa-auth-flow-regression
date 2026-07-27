const fs = require('fs');
const https = require('https');
const url = require('url');
const path = require('path');

const reportsDir = 'playwright-reports-merged';
let files = [];

try {
    if (fs.existsSync(reportsDir)) {
        const folders = fs.readdirSync(reportsDir);
        for (const folder of folders) {
            const jsonPath = path.join(reportsDir, folder, 'results.json');
            if (fs.existsSync(jsonPath)) {
                files.push(jsonPath);
            }
        }
    }
} catch (e) {
    console.error('Error reading reports directory:', e);
}

let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;
let totalFlaky = 0;

let hasFailedBatches = false;

if (files.length === 0) {
    hasFailedBatches = true;
    console.warn('No report files found!');
} else {
    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            const stats = data.stats;
            if (stats) {
                totalPassed += stats.expected || 0;
                totalFailed += stats.unexpected || 0;
                totalSkipped += stats.skipped || 0;
                totalFlaky += stats.flaky || 0;
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
            hasFailedBatches = true;
        }
    }
}

const totalTests = totalPassed + totalFailed + totalSkipped + totalFlaky;
const overallStatus = (totalFailed === 0 && !hasFailedBatches) ? '✅ PASS' : '❌ FAIL';

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!slackWebhookUrl) {
    console.log('SLACK_WEBHOOK_URL is not set. Printing payload for local verification:');
}

const githubServer = process.env.GITHUB_SERVER || 'https://github.com';
const githubRepo = process.env.GITHUB_REPO;
const githubRun = process.env.GITHUB_RUN;
const githubActor = process.env.GITHUB_ACTOR;
const githubRef = process.env.GITHUB_REF;
const githubEvent = process.env.GITHUB_EVENT;
const githubSha = process.env.GITHUB_SHA_VAL;

const payload = {
    blocks: [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `🚀 qa-auth-flow-orchestrator – Playwright CI (${githubEvent === 'schedule' ? 'Scheduled Run' : 'Push/Manual Run'})`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `_QA test suite for global authentication flows including login, signup, and password reset._\n\n*Overall Status:* ${overallStatus}\n\n*📊 Test Results Summary:*\n• *Total Tests:* ${totalTests}\n• *✅ Passed:* ${totalPassed}\n• *❌ Failed:* ${totalFailed}\n• *⏭️ Skipped:* ${totalSkipped}\n• *⚠️ Flaky:* ${totalFlaky}\n\n*Branch:* \`${githubRef}\`\n*Triggered by:* \`${githubActor}\`\n*Event:* \`${githubEvent}\`\n*Commit:* \`${githubSha}\`\n\n🔗 <${githubServer}/${githubRepo}/actions/runs/${githubRun}|View Workflow Run>\n🌐 <https://${githubRepo.split('/')[0]}.github.io/${githubRepo.split('/')[1]}/|View Public HTML Report>`
            }
        }
    ]
};

const payloadString = JSON.stringify(payload, null, 2);

if (!slackWebhookUrl || slackWebhookUrl === 'local') {
    console.log(payloadString);
    process.exit(0);
}

const webhookUrl = new url.URL(slackWebhookUrl);

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
