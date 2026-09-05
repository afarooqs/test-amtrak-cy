Feature: Positive Amtrak fare finder searches
  As a traveler
  I want valid search inputs to submit correctly
  So that journey payloads match expected itineraries

  Background:
    Given I open the Amtrak home fare finder

  @smoke
  Scenario Outline: One-way search payload is correct
    When I select origin "<fromQuery>" code <fromCode> and destination "<toQuery>" code <toCode>
    And I fill departure date <departInDays> days ahead
    And I submit the search
    Then the payload should match one-way trip "<fromCode>" to "<toCode>" departing in <departInDays> days

    Examples:
      | fromQuery | fromCode | toQuery    | toCode | departInDays |
      | Chicago   | CHI      | Milwaukee  | MKE    | 14           |
      | New York  | NYP      | Washington | WAS    | 21           |

  @smoke
  Scenario Outline: Round-trip search payload is correct
    When I choose trip type "Round-Trip"
    And I select origin "<fromQuery>" code <fromCode> and destination "<toQuery>" code <toCode>
    And I fill departure date <departInDays> days ahead
    And I fill return date <returnInDays> days ahead
    And I submit the search
    Then the payload should match round trip between "<fromCode>" and "<toCode>" with depart <departInDays> and return <returnInDays> days ahead

    Examples:
      | fromQuery | fromCode | toQuery    | toCode | departInDays | returnInDays |
      | New York  | NYP      | Washington | WAS    | 14           | 21           |
      | Chicago   | CHI      | Milwaukee  | MKE    | 16           | 23           |

  Scenario Outline: Station autocomplete commits coded stations
    When I select origin "<fromQuery>" code <fromCode> and destination "<toQuery>" code <toCode>
    Then origin should be committed as "<fromCode>"
    And destination should be committed as "<toCode>"

    Examples:
      | fromQuery | fromCode | toQuery    | toCode |
      | New York  | NYP      | Washington | WAS    |
      | Chicago   | CHI      | Milwaukee  | MKE    |

  Scenario: Search supports random passenger count between 1 and 4
    When I select origin "Chicago" code CHI and destination "Milwaukee" code MKE
    And I set a random passenger count between 1 and 4
    And I fill departure date 14 days ahead
    And I submit the search
    Then the payload should use the selected random passenger count

  Scenario: Multi-city payload is correct for two legs
    When I fill multi-city itinerary with legs:
      | fromQuery  | fromCode | toQuery    | toCode | departInDays |
      | New York   | NYP      | Washington | WAS    | 14           |
      | Washington | WAS      | Boston     | BOS    | 18           |
    And I submit the search
    Then the payload should match multi-city legs:
      | fromCode | toCode | departInDays |
      | NYP      | WAS    | 14           |
      | WAS      | BOS    | 18           |

  Scenario: Multi-city payload is correct for three legs
    When I fill multi-city itinerary with legs:
      | fromQuery  | fromCode | toQuery      | toCode | departInDays |
      | New York   | NYP      | Washington   | WAS    | 14           |
      | Washington | WAS      | Boston       | BOS    | 18           |
      | Boston     | BOS      | Philadelphia | PHL    | 21           |
    And I submit the search
    Then the payload should match multi-city legs:
      | fromCode | toCode | departInDays |
      | NYP      | WAS    | 14           |
      | WAS      | BOS    | 18           |
      | BOS      | PHL    | 21           |
