function step(name, fn) {
  cy.log(`**${name}**`);
  return fn();
}

module.exports = { step };
