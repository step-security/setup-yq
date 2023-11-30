"use strict";

const { promisify } = require("util");
const path = require("path");
const os = require("os");
const fs = require("fs");
const axios = require('axios');
const cache = require("@actions/tool-cache");
const core = require("@actions/core");

const chmod = promisify(fs.chmod);

if (require.main === module) {
  main().catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
}

async function validateSubscription() {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (error.response) {
      console.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io"
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
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
