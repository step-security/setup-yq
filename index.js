"use strict";

const { promisify } = require("util");
const path = require("path");
const os = require("os");
const fs = require("fs");
const axios = require('axios');
const cache = require("@actions/tool-cache");
const core = require("@actions/core");
const github = require('@actions/github');

const chmod = promisify(fs.chmod);

if (require.main === module) {
  main().catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
}

async function validateSubscription() {
  const repoPrivate = github.context?.payload?.repository?.private;
  const upstream = 'chrisdickinson/setup-yq';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) return;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body = { action: action || '' };

  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body, { timeout: 3000 }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(`\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`);
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}


async function main() {
  try {
    await validateSubscription();

    const url = core.getInput("yq-url");
    const version = core.getInput("yq-version");
    const platform = os.platform();
    let arch = os.arch();
    if (arch === "x64") {
      arch = "amd64";
    }

    let toolPath = cache.find("yq", version, arch);

    if (!toolPath) {
      const context = {
        arch,
        platform,
        version,
      };
      const rendered = url.replace(/\{(\w+?)\}/g, (a, match) => {
        return context[match] || "";
      });

      const downloadPath = await cache.downloadTool(rendered);
      toolPath = await cache.cacheFile(downloadPath, "yq", "yq", version);
    }

    await chmod(path.join(toolPath, "yq"), 0o755); // just in case we haven't preserved the executable bit
    core.addPath(toolPath);
  } catch (error) {
    core.setFailed(error.message);
  }
}
