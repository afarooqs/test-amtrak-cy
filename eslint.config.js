const js = require("@eslint/js");
const globals = require("globals");
const cypress = require("eslint-plugin-cypress/flat");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "cypress-report/**",
      "cypress/videos/**",
      "cypress/screenshots/**",
      "cypress/downloads/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["cypress/**/*.js"],
    ...cypress.configs.recommended,
    rules: {
      ...cypress.configs.recommended.rules,
      "cypress/no-unnecessary-waiting": "off",
      "cypress/unsafe-to-chain-command": "off",
    },
  },
];
