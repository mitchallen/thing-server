Feature: Data file defaults
  Every field in the data file is optional. A missing label, path or list
  falls back to 'things', '/v1' and an empty list, and a path written without
  a leading slash is mounted as if it had one.

  Scenario: A data file with no label, path or list serves the defaults
    Given the things file is "./test/data/bare/things.json"
    When I GET "/"
    Then the response status should be 200
    And the JSON property "meta.label" should equal "things"
    And the JSON property "meta.path" should equal "/v1"
    And the JSON property "meta.count" should equal 0

  Scenario: The default routes serve an empty list
    Given the things file is "./test/data/bare/things.json"
    When I GET "/v1/things"
    Then the response status should be 200
    And the response should be a JSON array with 0 items

  Scenario: A path without a leading slash is mounted with one
    Given the things file is "./test/data/noslash/things.json"
    When I GET "/v5/widgets/count"
    Then the response status should be 200
    And the JSON property "count" should equal 1

  Scenario: The root reports the normalized path
    Given the things file is "./test/data/noslash/things.json"
    When I GET "/"
    Then the response status should be 200
    And the JSON property "meta.path" should equal "/v5"
