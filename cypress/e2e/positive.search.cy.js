const { HomePage } = require("../support/pages/home.page");
const { step } = require("../support/step");
const cases = require("./data/search-cases");

function chooseRoundTrip(home) {
  home.chooseTripType("Round-Trip");
  home.tripTypeButton().should("contain.text", "Round-Trip");
}

function selectStationsAndExpectReturnDate(home, data) {
  home.selectStations(data);
  home.returnDate().should("be.visible").and("be.enabled");
}

describe("[Positive tests] Amtrak search", () => {
  const home = new HomePage();

  beforeEach(() => {
    home.open();
  });

  for (const data of cases.searchRequests) {
    it(`Search oneway itinerary [${data.name}]`, { tags: "@smoke" }, () => {
      let payload;

      step(
        `select origin ${data.fromCode} and destination ${data.toCode}`,
        () => {
          home.selectStations(data);
          home.expectStationsCommitted(data);
        },
      );

      step("fill depart date", () => {
        home.fillDepartDate(data.departInDays);
      });

      step("submit search", () => {
        home.submitJourney().then((body) => {
          payload = body;
        });
      });

      step("validate API payload", () => {
        cy.then(() => {
          home.validateApiPayload(payload, data, "OW");
        });
      });
    });
  }

  for (const data of cases.roundTrips) {
    it(`Search round trip itinerary [${data.name}]`, { tags: "@smoke" }, () => {
      let payload;

      step("choose Round-Trip", () => {
        chooseRoundTrip(home);
      });

      step(
        `select origin ${data.fromCode} and destination ${data.toCode}`,
        () => {
          selectStationsAndExpectReturnDate(home, data);
          home.expectStationsCommitted(data);
        },
      );

      step("fill depart and return dates", () => {
        home.fillDepartDate(data.departInDays);
        home.fillReturnDate(data.returnInDays);
      });

      step("submit search", () => {
        home.submitJourney().then((body) => {
          payload = body;
        });
      });

      step("validate API payload", () => {
        cy.then(() => {
          home.validateApiPayload(payload, data, "RT");
        });
      });
    });
  }

  for (const data of cases.autocompleteRoutes) {
    it(`Station autocomplete selects a coded station [${data.name}]`, () => {
      step(`type and select origin ${data.fromCode}`, () => {
        home.selectFromStation(data.fromQuery, data.fromCode);
        home
          .fromInput()
          .invoke("val")
          .should("match", home.committedStationPattern(data.fromCode));
      });

      step(`type and select destination ${data.toCode}`, () => {
        home.selectToStation(data.toQuery, data.toCode);
        home
          .toInput()
          .invoke("val")
          .should("match", home.committedStationPattern(data.toCode));
      });
    });
  }

  it("Search with a random passenger count between 1 and 4", () => {
    const data = cases.searchRequests[0];
    const passengers = 1 + Math.floor(Math.random() * 4);
    cy.log(`passengers: ${passengers}`);
    let payload;

    step(
      `select origin ${data.fromCode} and destination ${data.toCode}`,
      () => {
        home.selectStations(data);
        home.expectStationsCommitted(data);
      },
    );

    step(`set adult passengers to ${passengers}`, () => {
      home.setAdultPassengers(passengers);
    });

    step("fill depart date", () => {
      home.fillDepartDate(data.departInDays);
    });

    step("submit search", () => {
      home.submitJourney().then((body) => {
        payload = body;
      });
    });

    step("validate API payload", () => {
      cy.then(() => {
        home.validateApiPayload(payload, data, "OW", {
          passengerCount: passengers,
        });
      });
    });
  });

  for (const data of cases.multiCitySearches) {
    it(`Multi-City Trip searches ${data.legs.length} itineraries [${data.name}]`, () => {
      const first = data.legs[0];
      let payload;

      step(`fill itinerary 1: ${first.fromCode} to ${first.toCode}`, () => {
        home.selectStations(first, 0);
        home.expectStationsCommitted(first, 0);
        home.fillDepartDate(first.departInDays, 0);
      });

      for (let i = 1; i < data.legs.length; i += 1) {
        const leg = data.legs[i];
        const tripNumber = i + 1;

        step(`click Add Trip for itinerary ${tripNumber}`, () => {
          home.addTrip(i);
        });

        step(
          `fill itinerary ${tripNumber}: ${leg.fromCode} to ${leg.toCode}`,
          () => {
            home.selectStations(leg, i);
            home.expectStationsCommitted(leg, i);
            home.fillDepartDate(leg.departInDays, i);
          },
        );
      }

      step("submit search", () => {
        home.submitJourney().then((body) => {
          payload = body;
        });
      });

      step("validate API payload", () => {
        cy.then(() => {
          home.validateApiPayload(payload, data.legs[0], data.tripType, {
            legs: data.legs,
          });
        });
      });
    });
  }
});
