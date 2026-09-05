Feature: Negative Amtrak fare finder validations
  As a traveler
  I want invalid or incomplete searches blocked
  So that bad requests are not submitted

  Background:
    Given I open the Amtrak home fare finder

  Scenario: Find Trains stays disabled when both stations are empty
    Then Find Trains should be disabled

  Scenario: Find Trains stays disabled when destination is missing
    When I select origin "Chicago" code CHI
    Then Find Trains should be disabled

  Scenario Outline: Same origin and destination is blocked
    When I select the same station "<query>" code <code> as origin and destination
    Then same station search should be blocked

    Examples:
      | query    | code |
      | New York | NYP  |
      | Chicago  | CHI  |

  Scenario Outline: Invalid station query does not resolve coded station
    When I type invalid station query "<query>" in origin and destination
    Then origin should remain invalid and blocked
    And destination should remain invalid and blocked

    Examples:
      | query             |
      | ZZZXQ9NOTASTATION |
      | @@@###            |
