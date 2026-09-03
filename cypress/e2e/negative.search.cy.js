const { HomePage } = require("../support/pages/home.page");
const { step } = require("../support/step");
const cases = require("./data/search-cases");

describe("[Negative tests] Amtrak search", () => {
  const home = new HomePage();

  beforeEach(() => {
    home.open();
  });

  for (const data of cases.incompleteSearches) {
    it(`Incomplete stations keep Find Trains button disabled [${data.name}]`, () => {
      step(`Leave search incomplete: ${data.name}`, () => {
        data.setup(home);
      });

      step("Find Trains stays disabled", () => {
        home.expectFindTrainsDisabled();
      });
    });
  }

  for (const data of cases.sameStation) {
    it(`Find Trains button is disabled when Same origin and destination [${data.name}]`, () => {
      step(`Select ${data.code} as origin and destination`, () => {
        home.selectSameStation(data);
      });

      step("Find Trains stays disabled", () => {
        home.expectSameStationBlocked();
      });
    });
  }

  for (const data of cases.invalidStations) {
    it(`Invalid station name does not show any results [${data.name}]`, () => {
      step("Type an invalid origin and confirm no coded station", () => {
        home.typeInvalidOrigin(data.query);
        home.expectInvalidOriginBlocked();
      });

      step("Type an invalid destination and confirm no coded station", () => {
        home.typeInvalidDestination(data.query);
        home.expectInvalidDestinationBlocked();
      });
    });
  }
});
