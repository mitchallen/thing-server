Feature: API key enforcement
  The things routes require an x-api-key header only when API_KEY is set.
  The root (/) health check and the swagger explorer stay open either way.

  Scenario: Open by default when no API key is configured
    Given no API key is configured
    When I GET "/v1/things/count"
    Then the response status should be 200

  Scenario: Request without a key is rejected when enforcement is on
    Given the API key is "test-secret"
    When I GET "/v1/things/count"
    Then the response status should be 401
    And the JSON property "error" should equal "unauthorized"

  Scenario: Request with the wrong key is rejected
    Given the API key is "test-secret"
    When I GET "/v1/things/count" with api key "wrong-key"
    Then the response status should be 401

  Scenario: Request with the correct key succeeds
    Given the API key is "test-secret"
    When I GET "/v1/things/count" with api key "test-secret"
    Then the response status should be 200
    And the JSON property "count" should equal 3

  Scenario: Root stays open even with enforcement on
    Given the API key is "test-secret"
    When I GET "/"
    Then the response status should be 200

  Scenario: Swagger explorer stays open even with enforcement on
    Given the API key is "test-secret"
    When I GET "/api-docs/"
    Then the response status should be 200
