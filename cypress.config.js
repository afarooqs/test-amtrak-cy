const dns = require("node:dns");
const { defineConfig } = require("cypress");
const { plugin: cypressGrepPlugin } = require("@cypress/grep/plugin");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

// GitHub-hosted runners often have unreachable IPv6. Node 17+ tries AAAA
// first, so Cypress's visit/proxy hangs with ETIMEDOUT against Amtrak/Akamai
// even though Chrome itself is fine. Prefer IPv4 in this process.
dns.setDefaultResultOrder("ipv4first");

const ciUserAgent = process.env.CI
  ? {
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    }
  : {};

module.exports = defineConfig({
  video: true,
  videosFolder: "cypress/videos",
  screenshotsFolder: "cypress/screenshots",
  screenshotOnRunFailure: true,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  defaultCommandTimeout: 15_000,
  pageLoadTimeout: 120_000,
  requestTimeout: 60_000,
  responseTimeout: 120_000,
  viewportWidth: 1440,
  viewportHeight: 900,
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  ...ciUserAgent,
  numTestsKeptInMemory: 0,
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress-report",
    charts: true,
    reportPageTitle: "Amtrak Cypress report",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: true,
    videoOnFailOnly: false,
  },
  env: {
    "cypress-cucumber-preprocessor": {
      stepDefinitions: "cypress/e2e/step_definitions/**/*.js",
    },
  },
  e2e: {
    specPattern: "cypress/e2e/features/**/*.feature",
    supportFile: "cypress/support/e2e.js",
    testIsolation: true,
    async setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
      cypressGrepPlugin(config);
      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium") {
          launchOptions.args.push(
            "--disable-quic",
            "--dns-over-https-mode=off",
            "--disable-features=AsyncDns,HttpsUpgrades,UseDnsHttpsSvcb",
          );
        }
        return launchOptions;
      });
      return config;
    },
  },
});
