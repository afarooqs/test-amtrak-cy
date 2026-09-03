require("cypress-mochawesome-reporter/register");
const { register: registerCypressGrep } = require("@cypress/grep");

registerCypressGrep();
require("./commands");

// Amtrak's client bundles throw in automation (jQuery `$`, CommonJS
// `require`, analytics). Ignore application exceptions so tests assert
// fare-finder behavior instead of third-party script load order.
Cypress.on("uncaught:exception", () => false);

beforeEach(() => {
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
  ];
  for (const url of blocked) {
    cy.intercept(url, { statusCode: 204, body: "" });
  }
});
