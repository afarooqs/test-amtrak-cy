const { formatMmDdYyyy, futureDate, isoDate } = require("../dates");

/**
 * Page Object Model - Home page
 */
class HomePage {
  fareFinder() {
    return cy.get('[amt-auto-test-id="fare-finder-cmp"]');
  }

  fromField(index = 0) {
    return this.fareFinder()
      .find('[amt-auto-test-id="fare-finder-from-station-field-page"]')
      .eq(index);
  }

  toField(index = 0) {
    return this.fareFinder()
      .find('[amt-auto-test-id="fare-finder-to-station-field-page"]')
      .eq(index);
  }

  fromInput(index = 0) {
    return this.fromField(index).find("input.station-input");
  }

  toInput(index = 0) {
    return this.toField(index).find("input.station-input");
  }

  departDate(index = 0) {
    return this.fareFinder()
      .find('[data-julie="departdisplay_booking_oneway"]:visible')
      .eq(index);
  }

  travelerDropdown() {
    return this.fareFinder().find(
      '[amt-auto-test-id="traveler-dropdown-button"]',
    );
  }

  addTripButton() {
    return this.fareFinder().find('[amt-auto-test-id="multi-city-add-trip"]');
  }

  adultIncrement() {
    return cy.get('[amt-auto-test-id="traveler-component-adult-incr-button"]');
  }

  adultCountInput() {
    return this.adultIncrement()
      .closest('[role="group"]')
      .find("input")
      .filter(":visible")
      .first();
  }

  travelerDone() {
    return cy.get(
      '[amt-auto-test-id="traveler-component-discount-done-button"]',
    );
  }

  roundTripDepartDate() {
    return this.fareFinder().find(
      '[data-julie="departdisplay_booking_roundtrip"]',
    );
  }

  returnDate() {
    return this.fareFinder().find(
      '[data-julie="returndisplay_booking_roundtrip"]',
    );
  }

  findTrains() {
    return this.fareFinder()
      .find('[amt-auto-test-id="fare-finder-findtrains-button"]')
      .should(($els) => {
        const match = [...$els].find((el) => this.laidOut(el));
        expect(match, "FIND TRAINS button").to.exist;
      })
      .then(($els) => {
        const match = [...$els].find((el) => this.laidOut(el));
        return cy.wrap(match);
      });
  }

  tripTypeButton() {
    return this.fareFinder().find(
      '[amt-auto-test-id="fare-finder-travel-selection"]',
    );
  }

  sameStationError() {
    return this.fareFinder().find(".same-station-error");
  }

  cookieBanner() {
    return cy.get("#onetrust-banner-sdk, #onetrust-consent-sdk");
  }

  /**
   * Playwright getByRole('button', { name }) matches <button>,
   * [role=button], and input[type=submit]. Cypress .contains('button')
   * does not.
   */
  namedControl(namePattern, options = {}) {
    const root = options.root || (() => cy.get("body"));
    const timeout = options.timeout || 15_000;
    const selectors =
      'button, [role="button"], input[type="button"], input[type="submit"], a';

    const pick = ($els) => {
      const matches = [...$els].filter((el) => {
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) {
          return false;
        }
        const labels = [
          el.getAttribute("aria-label"),
          el.getAttribute("value"),
          el.innerText,
          el.textContent,
        ]
          .filter(Boolean)
          .map((value) => value.replace(/\s+/g, " ").trim());
        return labels.some((label) => namePattern.test(label));
      });
      if (options.last) {
        return matches[matches.length - 1];
      }
      return matches[0];
    };

    return root()
      .find(selectors, { timeout })
      .should(($els) => {
        expect(pick($els), `control matching ${namePattern}`).to.exist;
      })
      .then(($els) => cy.wrap(pick($els)));
  }

  open() {
    cy.visit("/home", {
      timeout: 120_000,
      retryOnNetworkFailure: true,
    });
    this.dismissCookieBanner();
    this.fareFinder().should("be.visible");
    this.dismissSignInPrompt();
  }

  dismissCookieBanner() {
    cy.document().then((doc) => {
      return new Cypress.Promise((resolve) => {
        const started = Date.now();
        const timer = setInterval(() => {
          const btn =
            doc.querySelector("#onetrust-reject-all-handler") ||
            [...doc.querySelectorAll("button, a")].find((el) =>
              /^Reject All$/i.test((el.textContent || "").trim()),
            );
          const visible =
            btn &&
            btn.getBoundingClientRect().height > 0 &&
            btn.getBoundingClientRect().width > 0;
          if (visible) {
            clearInterval(timer);
            btn.click();
            resolve();
            return;
          }
          if (Date.now() - started > 10_000) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
    cy.get("body").then(($body) => {
      const banner = $body.find(
        "#onetrust-banner-sdk:visible, #onetrust-consent-sdk:visible",
      );
      if (banner.length) {
        cy.wrap(banner.first(), { timeout: 5_000 }).should("not.be.visible");
      }
    });
  }

  dismissSignInPrompt() {
    cy.get("body").then(($body) => {
      const close = $body.find(
        '[amt-auto-test-id="sign-in-register-close"]:visible',
      );
      if (close.length) {
        cy.wrap(close.first()).click({ force: true });
      }
    });
  }

  /**
   * Angular keeps document focus on From even after To is clicked.
   * Keyboard typing therefore lands in the wrong field. Set the value
   * on the target input and fire InputEvents instead.
   */
  setInputValue(el, value) {
    const view = el.ownerDocument.defaultView;
    const descriptor = Object.getOwnPropertyDescriptor(
      view.HTMLInputElement.prototype,
      "value",
    );
    descriptor.set.call(el, value);
    el.dispatchEvent(
      new view.InputEvent("input", {
        bubbles: true,
        composed: true,
        data: value,
        inputType: "insertText",
      }),
    );
    el.dispatchEvent(new view.Event("change", { bubbles: true }));
  }

  clickStationOption(fieldFn, stationCode) {
    fieldFn()
      .find(".ads-cursor-pointer")
      .filter(`:contains((${stationCode}))`)
      .should(($els) => {
        const match = [...$els].find((el) => {
          const box = el.getBoundingClientRect();
          return (
            box.height > 8 &&
            box.width > 8 &&
            el.textContent.includes(`(${stationCode})`)
          );
        });
        expect(match, `No visible station option for (${stationCode})`).to
          .exist;
      })
      .then(($els) => {
        const match = [...$els].find((el) => {
          const box = el.getBoundingClientRect();
          return (
            box.height > 8 &&
            box.width > 8 &&
            el.textContent.includes(`(${stationCode})`)
          );
        });
        match.click();
      });
  }

  selectStation(fieldFn, inputFn, siblingFn, query, stationCode) {
    siblingFn()
      .invoke("val")
      .then((siblingBefore) => {
        fieldFn().click({ force: true });
        inputFn().then(($el) => {
          this.setInputValue($el[0], query);
        });
        siblingFn().should("have.value", siblingBefore);
        this.clickStationOption(fieldFn, stationCode);
        inputFn()
          .invoke("val")
          .should("match", this.committedStationPattern(stationCode));
        siblingFn().should("have.value", siblingBefore);
      });
  }

  selectFromStation(query, stationCode, index = 0) {
    this.selectStation(
      () => this.fromField(index),
      () => this.fromInput(index),
      () => this.toInput(index),
      query,
      stationCode,
    );
  }

  selectToStation(query, stationCode, index = 0) {
    this.selectStation(
      () => this.toField(index),
      () => this.toInput(index),
      () => this.fromInput(index),
      query,
      stationCode,
    );
  }

  selectStations(data, index = 0) {
    this.selectFromStation(data.fromQuery, data.fromCode, index);
    this.selectToStation(data.toQuery, data.toCode, index);
  }

  selectSameStation(data) {
    this.selectFromStation(data.query, data.code);
    this.selectToStation(data.query, data.code);
  }

  typeStationQuery(which, query) {
    const input = which === "from" ? this.fromInput() : this.toInput();
    const field = which === "from" ? this.fromField() : this.toField();
    field.click({ force: true });
    input.then(($el) => {
      this.setInputValue($el[0], query);
    });
  }

  calendarDayName(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  calendarOpen($body) {
    return [...$body.find('[role="gridcell"]')].some((el) => {
      const box = el.getBoundingClientRect();
      return box.height > 8 && box.width > 8;
    });
  }

  findDoneButton($body) {
    return [...$body.find('button, [role="button"]')].find((el) => {
      const box = el.getBoundingClientRect();
      if (box.height < 8 || box.width < 8) {
        return false;
      }
      const labels = [
        el.getAttribute("aria-label"),
        el.innerText,
        el.textContent,
      ]
        .filter(Boolean)
        .map((value) => value.replace(/\s+/g, " ").trim());
      return labels.some((label) => /^done$/i.test(label));
    });
  }

  confirmDatePicker() {
    cy.get("body", { timeout: 10_000 }).should(($body) => {
      expect(
        !this.calendarOpen($body) || this.findDoneButton($body),
        "calendar closed or Done visible",
      ).to.be.ok;
    });
    cy.get("body").then(($body) => {
      if (!this.calendarOpen($body)) {
        return;
      }
      const done = this.findDoneButton($body);
      if (done) {
        cy.wrap(done).click({ force: true });
      }
    });
    // Round-trip keeps the picker open after the outbound date until
    // the return date is chosen. Playwright ignores a still-open picker.
    cy.get("body").then(($body) => {
      if (!this.calendarOpen($body)) {
        return;
      }
      const done = this.findDoneButton($body);
      if (
        done &&
        !done.disabled &&
        done.getAttribute("aria-disabled") !== "true"
      ) {
        cy.wrap(done).click({ force: true });
      }
    });
  }

  openDepartDate(index = 0) {
    if (index !== 0) {
      this.departDate(index).click({ force: true });
      return;
    }
    this.roundTripDepartDate().then(($rt) => {
      const visible = $rt.filter(":visible");
      if (visible.length) {
        cy.wrap(visible.first()).click({ force: true });
        return;
      }
      this.departDate(0).click({ force: true });
    });
  }

  fillDateInput(daysAhead, index = 0, which = "depart") {
    this.fromInput(index)
      .invoke("val")
      .then((fromBefore) => {
        this.toInput(index)
          .invoke("val")
          .then((toBefore) => {
            const date = futureDate(daysAhead);
            const dayName = this.calendarDayName(date);

            cy.get("body").then(($body) => {
              if (!this.calendarOpen($body)) {
                if (which === "return") {
                  this.returnDate().click({ force: true });
                } else {
                  this.openDepartDate(index);
                }
              }
            });

            cy.get(`[role="gridcell"][aria-label="${dayName}"]`, {
              timeout: 10_000,
            })
              .filter((_, el) => {
                const box = el.getBoundingClientRect();
                return box.height > 8 && box.width > 8;
              })
              .first()
              .click();
            this.confirmDatePicker();
            if (which === "return") {
              cy.get("body").then(($body) => {
                if (!this.calendarOpen($body)) {
                  return;
                }
                const close = [...$body.find("button, [role='button']")].find(
                  (el) => {
                    const box = el.getBoundingClientRect();
                    if (box.height < 8) {
                      return false;
                    }
                    const label = (
                      el.getAttribute("aria-label") ||
                      el.innerText ||
                      ""
                    )
                      .replace(/\s+/g, " ")
                      .trim();
                    return /^close$/i.test(label);
                  },
                );
                if (close) {
                  cy.wrap(close).click({ force: true });
                }
              });
              cy.get("body", { timeout: 10_000 }).should(($body) => {
                expect(
                  this.calendarOpen($body),
                  "return date picker still open",
                ).to.eq(false);
              });
            }

            this.fromInput(index).should("have.value", fromBefore);
            this.toInput(index).should("have.value", toBefore);
            cy.wrap(formatMmDdYyyy(date));
          });
      });
  }

  /**
   * Fills the departure date field with a date a specified number of days in the future.
   * @param {*} daysAhead - this is hardcoded for simplicity, but could be made dynamic to support testing different date ranges
   */
  fillDepartDate(daysAhead = 14, index = 0) {
    this.fillDateInput(daysAhead, index, "depart");
  }

  fillReturnDate(daysAhead = 21) {
    this.fillDateInput(daysAhead, 0, "return");
  }

  laidOut(el) {
    const box = el.getBoundingClientRect();
    return box.height > 8 && box.width > 8;
  }

  visibleAdultIncrement($body) {
    return [
      ...$body.find(
        '[amt-auto-test-id="traveler-component-adult-incr-button"]',
      ),
    ].find((el) => this.laidOut(el));
  }

  clickLaidOut($els) {
    const match = [...$els].find((el) => this.laidOut(el));
    expect(match, "laid-out control").to.exist;
    match.click();
  }

  setAdultPassengers(count) {
    this.travelerDropdown().then(($els) => this.clickLaidOut($els));
    cy.get("body").should(($body) => {
      expect(this.visibleAdultIncrement($body), "adult increment control").to
        .exist;
    });
    this.adultCountInput()
      .invoke("val")
      .then((currentRaw) => {
        const current = Number(currentRaw);
        for (let i = current; i < count; i += 1) {
          cy.get("body").then(($body) => {
            const incr = this.visibleAdultIncrement($body);
            expect(incr, "adult increment control").to.exist;
            incr.click();
          });
        }
      });
    this.adultCountInput().should("have.value", String(count));
    this.travelerDone().then(($els) => this.clickLaidOut($els));
    cy.get("body").should(($body) => {
      expect(this.visibleAdultIncrement($body), "traveler panel still open").to
        .not.exist;
    });
    this.travelerDropdown().should(($el) => {
      const expected =
        count === 1 ? /1\s*Traveler/ : new RegExp(`${count}\\s*Travelers`);
      expect($el.text()).to.match(expected);
    });
  }

  addTrip(index) {
    this.addTripButton().then(($button) => {
      $button[0].click();
    });
    this.tripTypeButton().should("contain.text", "Multi-City");
    this.fromInput(index).should("be.visible");
  }

  confirmTravelers() {
    this.travelerDropdown().then(($els) => this.clickLaidOut($els));
    this.travelerDone().then(($els) => this.clickLaidOut($els));
    cy.get("body").should(($body) => {
      expect(this.visibleAdultIncrement($body), "traveler panel still open").to
        .not.exist;
    });
  }

  submitFindTrains() {
    this.findTrains()
      .scrollIntoView()
      .should(($el) => {
        expect($el.attr("aria-disabled")).to.not.eq("true");
      });
    this.findTrains().scrollIntoView().click({ force: true });
  }

  submitJourney() {
    let payload;
    cy.intercept("POST", /\/dotcom\/journey-solution-option/, (req) => {
      payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      req.continue();
    }).as("journeySearch");
    this.confirmTravelers();
    this.submitFindTrains();
    return cy
      .wrap(null, { timeout: 25_000 })
      .should(() => {
        expect(payload, "journey search POST").to.exist;
      })
      .then(() => payload);
  }

  chooseTripType(label) {
    this.tripTypeButton().click();
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    this.namedControl(new RegExp(`^${escaped}$`, "i"), { last: true }).click();
  }

  committedStationPattern(code) {
    return new RegExp(`(^${code}\\b)|(\\(${code}\\))`);
  }

  expectStationsCommitted(data, index = 0) {
    this.fromInput(index)
      .invoke("val")
      .should("match", this.committedStationPattern(data.fromCode));
    this.toInput(index)
      .invoke("val")
      .should("match", this.committedStationPattern(data.toCode));
  }

  passengerCountFromPayload(payload) {
    const journey = payload.journeyRequest;
    const groups = [
      journey.passengers,
      journey.customers,
      journey.travelers,
      journey.passenger,
      journey.passengers?.passenger,
    ].filter((value) => Array.isArray(value));
    if (groups.length) {
      return groups[0].length;
    }
    const adultMarks = JSON.stringify(payload).match(/"type":"F"/g);
    if (adultMarks) {
      return adultMarks.length;
    }
    throw new Error(
      `Unable to read passenger count. journeyRequest keys: ${Object.keys(journey).join(", ")}`,
    );
  }

  validateApiPayload(payload, data, tripType, options = {}) {
    const expectedLegs =
      options.legs ||
      (tripType === "RT"
        ? [
            {
              fromCode: data.fromCode,
              toCode: data.toCode,
              departInDays: data.departInDays,
            },
            {
              fromCode: data.toCode,
              toCode: data.fromCode,
              departInDays: data.returnInDays,
            },
          ]
        : [data]);
    const legs = payload.journeyRequest.journeyLegRequests;
    expect(payload.journeyRequest.type).to.eq(tripType);
    expect(legs).to.have.length(expectedLegs.length);
    for (let i = 0; i < expectedLegs.length; i += 1) {
      const leg = legs[i];
      const expected = expectedLegs[i];
      expect(leg.origin.code).to.eq(expected.fromCode);
      expect(leg.destination.code).to.eq(expected.toCode);
      expect(leg.origin.schedule.departureDateTime).to.include(
        isoDate(expected.departInDays),
      );
    }
    if (options.passengerCount != null) {
      expect(this.passengerCountFromPayload(payload)).to.eq(
        options.passengerCount,
      );
    }
  }

  isDisabledControl($el) {
    const el = $el[0];
    return Boolean(
      el.disabled ||
      el.getAttribute("aria-disabled") === "true" ||
      el.getAttribute("disabled") != null,
    );
  }

  expectFindTrainsDisabled() {
    this.findTrains().should(($el) => {
      expect(this.isDisabledControl($el)).to.eq(true);
    });
  }

  expectSameStationBlocked() {
    this.findTrains().should(($el) => {
      const message =
        Cypress.$(
          '[amt-auto-test-id="fare-finder-cmp"] .same-station-error',
        ).text() || "";
      expect(
        this.isDisabledControl($el) ||
          /same|identical|different station/i.test(message),
      ).to.eq(true);
    });
  }

  typeInvalidOrigin(query) {
    this.typeStationQuery("from", query);
    cy.wait(1200);
  }

  typeInvalidDestination(query) {
    this.typeStationQuery("to", query);
    cy.wait(1200);
  }

  expectInvalidOriginBlocked() {
    this.fromInput()
      .invoke("val")
      .should("not.match", /\([A-Z]{3}\)/);
    this.expectFindTrainsDisabled();
  }

  expectInvalidDestinationBlocked() {
    this.toInput()
      .invoke("val")
      .should("not.match", /\([A-Z]{3}\)/);
    this.expectFindTrainsDisabled();
  }
}

module.exports = { HomePage };
