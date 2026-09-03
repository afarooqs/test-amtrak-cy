# Amtrak search tests

Data-driven Cypress coverage for the Amtrak.com fare finder. Tests use a page object, HTML reporting with logged steps, screenshots on failure, and video on every run.

## Requirements

Minimum tooling to clone and run the suite:

| Software | Minimum   | Notes                                                                                            |
| -------- | --------- | ------------------------------------------------------------------------------------------------ |
| Git      | 2.30+     | Needed to clone the repository                                                                   |
| Node.js  | 22        | Required by `package.json` `engines`. GitHub Actions uses Node 22                                |
| npm      | 10        | Ships with Node 22; `npm ci` needs lockfile version 3                                            |
| Browsers | see below | Default CI/local run uses **Chrome**. Cross-browser runs need Edge and Firefox installed locally |

You also need outbound HTTPS to `github.com`, the npm registry, and `www.amtrak.com`.

## Setup

```bash
git clone https://github.com/afarooqs/test-amtrak-cy.git
cd test-amtrak-cy
npm ci
```

Cypress downloads its bundled browser on first run. `npm test` launches **Chrome**.

## Commands

| Command                      | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `npm test`                   | Full suite in Chrome; retry a failed test once     |
| `npm run test:headed`        | Headed Chrome                                      |
| `npm run test:open`          | Cypress Test Runner UI                             |
| `npm run test:cross-browser` | Desktop Google Chrome, Microsoft Edge, and Firefox |
| `npm run test:mobile`        | Chrome with Pixel 7 then iPhone 14 viewports       |
| `npm run test:report`        | Open the last HTML report                          |
| `npm run test:smoke`         | Tests tagged `@smoke`                              |
| `npm run lint`               | ESLint                                             |

## Extra browsers

`npm test` only launches **Chrome**. Install Edge and Firefox yourself for `npm run test:cross-browser`. Cypress skips any of those browsers it cannot find, so the script still succeeds on a Chrome-only machine.

Amtrak is served over HTTP/2 behind Akamai. Cypress 16 loads that traffic through Chrome or Edge's own network stack. Firefox still uses Cypress's older HTTP/1.1 proxy, which Amtrak often stalls, so `npm run test:cross-browser` may fail in Firefox.

Cypress does not ship Safari/WebKit the same way Playwright does. Mobile coverage uses Chrome with Pixel 7 (`412x915`) and iPhone 14 (`390x844`) viewports.

## Summary of Repository

A brief overview of the features of this repository:

- Uses Cypress to run Page Object Model pattern for tests.
- Positive and Negative tests.
- Data Driven tests.
- `beforeEach` home-page setup equivalent to Playwright fixtures.
- API validation from Amtrak's API when search is performed (`cy.intercept` on the journey POST).
- A couple of tests are tagged `smoke` tests which are run on every push to remote origin, giving quick feedback for each Pull Request.
- Integration with Github Actions to show CI features.
- 3 different Github Actions workflows: smoke test, scheduled runs (every hour), e2e tests (runs full test suite).
- Videos are recorded for every test case whether they pass or fail for demonstration purposes. Ideally videos are recorded only on failure.
- If a test fails it is retried once and a screenshot is also attached in the test report.
- Review test activity in the Mochawesome HTML report.
- Cross Browser testing through Cypress `--browser` (Chrome, Edge, Firefox).
- Test reports published to GitHub Pages https://afarooqs.github.io/test-amtrak-cy/

## Test Suite

The current test suite covers these areas:

1. One-way search payload validation with smoke coverage (`@smoke`)
2. Round-trip search payload validation with smoke coverage (`@smoke`)
3. Station autocomplete selects a coded station
4. Search request includes a random passenger count between 1 and 4
5. Multi-city itinerary requests validate multiple legs in one submission
6. Incomplete stations keep Find Trains disabled
7. Same origin and destination is rejected
8. Invalid station queries do not yield coded station results

Search submission asserts the `POST /dotcom/journey-solution-option` body. Amtrak may still return HTTP 403 to automated browsers; the suite verifies that the request was sent with the expected origin, destination, trip type, and date.

## CI

GitHub Actions on `main` and pull requests:

- ESLint
- Cypress (one run per test, retry once on failure)
- HTML report published to [GitHub Pages](https://afarooqs.github.io/test-amtrak-cy/) after each `main` run

## License

MIT. See [LICENSE](LICENSE).
