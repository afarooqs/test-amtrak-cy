const { spawnSync } = require("node:child_process");

const TARGETS = ["chrome", "edge", "firefox"];

function detectedBrowsers() {
  const result = spawnSync("npx", ["cypress", "info"], {
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    process.stderr.write(`${result.stdout || ""}${result.stderr || ""}`);
    process.exit(result.status || 1);
  }

  const names = new Set();
  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^\s*- Name:\s+(\S+)/);
    if (match) {
      names.add(match[1]);
    }
  }
  return names;
}

function run(browser) {
  const result = spawnSync("npx", ["cypress", "run", "--browser", browser], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const installed = detectedBrowsers();
let ran = 0;
for (const browser of TARGETS) {
  if (!installed.has(browser)) {
    process.stdout.write(
      `Skipping ${browser}: Cypress did not find it on this machine.\n`,
    );
    continue;
  }
  run(browser);
  ran += 1;
}

if (ran === 0) {
  process.stderr.write(
    "No target browsers installed (chrome, edge, firefox).\n",
  );
  process.exit(1);
}
