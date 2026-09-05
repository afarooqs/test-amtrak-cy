require("cypress-mochawesome-reporter/register");
const { register: registerCypressGrep } = require("@cypress/grep");

registerCypressGrep();
require("./commands");

// Amtrak's client bundles throw in automation (jQuery `$`, CommonJS
// `require`, analytics). Ignore application exceptions so tests assert
// fare-finder behavior instead of third-party script load order.
Cypress.on("uncaught:exception", () => false);

Cypress.Commands.add("stubThirdPartyBeacons", () => {
  const blocked = [
    "**/*.dynatrace.com/**",
    "**/*.decibelinsight.net/**",
    "**/google-analytics.com/**",
    "**/googletagmanager.com/**",
    "**/doubleclick.net/**",
    "**/facebook.net/**",
    "**/hotjar.com/**",
    "**/newrelic.com/**",
    "**/nr-data.net/**",
    "**/akstat.io/**",
    "**/go-mpulse.net/**",
    "**/*.mpulse.net/**",
    "**/ensighten.com/**",
    "**/*.adobedtm.com/**",
    "**/omtrdc.net/**",
    "**/demdex.net/**",
    "**/scorecardresearch.com/**",
    "**/qualtrics.com/**",
    "**/quantummetric.com/**",
  ];
  for (const url of blocked) {
    cy.intercept(url, { statusCode: 204, body: "" });
  }
});
