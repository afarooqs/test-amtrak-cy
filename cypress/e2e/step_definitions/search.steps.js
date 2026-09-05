const {
  Before,
  Given,
  When,
  Then,
} = require("@badeball/cypress-cucumber-preprocessor");
const { HomePage } = require("../../support/pages/home.page");

let home;
let payload;
let selectedPassengerCount;

Before(() => {
  home = new HomePage();
  payload = undefined;
  selectedPassengerCount = undefined;
  cy.stubThirdPartyBeacons();
});

Given("I open the Amtrak home fare finder", () => {
  home.open();
});

When(
  "I select origin {string} code {word} and destination {string} code {word}",
  (fromQuery, fromCode, toQuery, toCode) => {
    const data = { fromQuery, fromCode, toQuery, toCode };
    home.selectStations(data);
    home.expectStationsCommitted(data);
  },
);

When("I select origin {string} code {word}", (fromQuery, fromCode) => {
  home.selectFromStation(fromQuery, fromCode);
  home
    .fromInput()
    .invoke("val")
    .should("match", home.committedStationPattern(fromCode));
});

When("I choose trip type {string}", (tripType) => {
  home.chooseTripType(tripType);
  home.tripTypeButton().should("contain.text", tripType);
});

When("I fill departure date {int} days ahead", (daysAhead) => {
  home.fillDepartDate(daysAhead);
});

When("I fill return date {int} days ahead", (daysAhead) => {
  home.fillReturnDate(daysAhead);
});

When("I submit the search", () => {
  home.submitJourney().then((body) => {
    payload = body;
  });
});

Then(
  "the payload should match one-way trip {string} to {string} departing in {int} days",
  (fromCode, toCode, departInDays) => {
    home.validateApiPayload(payload, { fromCode, toCode, departInDays }, "OW");
  },
);

Then(
  "the payload should match round trip between {string} and {string} with depart {int} and return {int} days ahead",
  (fromCode, toCode, departInDays, returnInDays) => {
    home.validateApiPayload(
      payload,
      { fromCode, toCode, departInDays, returnInDays },
      "RT",
    );
  },
);

Then("origin should be committed as {string}", (fromCode) => {
  home
    .fromInput()
    .invoke("val")
    .should("match", home.committedStationPattern(fromCode));
});

Then("destination should be committed as {string}", (toCode) => {
  home
    .toInput()
    .invoke("val")
    .should("match", home.committedStationPattern(toCode));
});

When("I set a random passenger count between 1 and 4", () => {
  selectedPassengerCount = 1 + Math.floor(Math.random() * 4);
  cy.log(`passengers: ${selectedPassengerCount}`);
  home.setAdultPassengers(selectedPassengerCount);
});

Then("the payload should use the selected random passenger count", () => {
  home.validateApiPayload(
    payload,
    { fromCode: "CHI", toCode: "MKE", departInDays: 14 },
    "OW",
    { passengerCount: selectedPassengerCount },
  );
});

When("I fill multi-city itinerary with legs:", (table) => {
  const legs = table.hashes();

  legs.forEach((leg, index) => {
    const data = {
      fromQuery: leg.fromQuery,
      fromCode: leg.fromCode,
      toQuery: leg.toQuery,
      toCode: leg.toCode,
      departInDays: Number(leg.departInDays),
    };

    if (index > 0) {
      home.addTrip(index);
    }

    home.selectStations(data, index);
    home.expectStationsCommitted(data, index);
    home.fillDepartDate(data.departInDays, index);
  });
});

Then("the payload should match multi-city legs:", (table) => {
  const legs = table.hashes().map((leg) => ({
    fromCode: leg.fromCode,
    toCode: leg.toCode,
    departInDays: Number(leg.departInDays),
  }));

  home.validateApiPayload(payload, legs[0], "MC", { legs });
});

Then("Find Trains should be disabled", () => {
  home.expectFindTrainsDisabled();
});

When(
  "I select the same station {string} code {word} as origin and destination",
  (query, code) => {
    home.selectSameStation({ query, code });
  },
);

Then("same station search should be blocked", () => {
  home.expectSameStationBlocked();
});

When(
  "I type invalid station query {string} in origin and destination",
  (query) => {
    home.typeInvalidOrigin(query);
    home.typeInvalidDestination(query);
  },
);

Then("origin should remain invalid and blocked", () => {
  home.expectInvalidOriginBlocked();
});

Then("destination should remain invalid and blocked", () => {
  home.expectInvalidDestinationBlocked();
});
