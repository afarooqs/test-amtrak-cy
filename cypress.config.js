const dns = require("node:dns");
const { defineConfig } = require("cypress");
const { plugin: cypressGrepPlugin } = require("@cypress/grep/plugin");

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
    runMode: 1,
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
  e2e: {
    baseUrl: "https://www.amtrak.com",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    testIsolation: true,
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
      cypressGrepPlugin(config);
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium") {
          launchOptions.args.push("--disable-quic");
          try {
            const ip = dns.lookupSync("www.amtrak.com", { family: 4 }).address;
            launchOptions.args.push(
              `--host-resolver-rules=MAP www.amtrak.com ${ip},MAP amtrak.com ${ip}`,
            );
          } catch {
            // fall back to OS DNS
          }
        }
        return launchOptions;
      });
      return config;
    },
  },
});
