Feature: waste collection calendar

  Scenario: When I input the postcode, the calendar shows
    Given I navigate to the correct URL
    When I input my postcode
    Then The calendar component appears
    Then Send all the collection dates
