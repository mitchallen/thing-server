Feature: thing-server REST API
  The server returns JSON "things" from the default data set and serves an
  OpenAPI explorer. The default data set has three things: alpha, beta, gamma.

  Scenario: Service health at the root
    When I GET "/"
    Then the response status should be 200
    And the JSON property "status" should equal "OK"
    And the JSON property "app" should equal "thing-server"
    And the JSON property "route" should equal "/"
    And the JSON property "explorer" should equal "/api-docs"
    And the JSON property "meta.count" should equal 3

  Scenario: Things route status
    When I GET "/v1"
    Then the response status should be 200
    And the JSON property "status" should equal "OK"

  Scenario: List all things
    When I GET "/v1/things"
    Then the response status should be 200
    And the response should be a JSON array with 3 items

  Scenario: Count things
    When I GET "/v1/things/count"
    Then the response status should be 200
    And the JSON property "count" should equal 3

  Scenario: Get a thing by its 1-based id
    When I GET "/v1/things/1"
    Then the response status should be 200
    And the JSON property "title" should equal "alpha"

  Scenario: Thing id out of range returns 404
    When I GET "/v1/things/999"
    Then the response status should be 404

  Scenario: Swagger explorer is served
    When I GET "/api-docs/"
    Then the response status should be 200

  Scenario: Unknown route returns 404
    When I GET "/does-not-exist"
    Then the response status should be 404
    And the JSON property "error" should equal "not found"
