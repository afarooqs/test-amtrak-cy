const { HomePage } = require("./pages/home.page");

Cypress.Commands.add("openHome", () => {
  const home = new HomePage();
  home.open();
  return cy.wrap(home);
});
