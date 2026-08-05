Feature: APP_NAME and BASE_PATH environment overrides
  APP_NAME overrides the name reported in the root and 404 bodies. BASE_PATH
  mounts the whole API — root, things routes and the swagger explorer — under
  a sub-path. Unset, both keep the original defaults.

  Scenario: The app name defaults to thing-server
    When I GET "/"
    Then the response status should be 200
    And the JSON property "app" should equal "thing-server"

  Scenario: APP_NAME overrides the name in the root response
    Given the app name is "widget-server"
    When I GET "/"
    Then the response status should be 200
    And the JSON property "app" should equal "widget-server"

  Scenario: APP_NAME overrides the name in the 404 response
    Given the app name is "widget-server"
    When I GET "/does-not-exist"
    Then the response status should be 404
    And the JSON property "app" should equal "widget-server"

  Scenario: APP_NAME overrides the name in the unauthorized response
    Given the app name is "widget-server"
    And the API key is "test-secret"
    When I GET "/v1/things/count"
    Then the response status should be 401
    And the JSON property "app" should equal "widget-server"

  Scenario: BASE_PATH mounts the root under a sub-path
    Given the base path is "/api/svc1"
    When I GET "/api/svc1"
    Then the response status should be 200
    And the JSON property "status" should equal "OK"
    And the JSON property "route" should equal "/api/svc1"
    And the JSON property "explorer" should equal "/api/svc1/api-docs"
    And the JSON property "meta.path" should equal "/api/svc1/v1"

  Scenario: BASE_PATH mounts the things routes under a sub-path
    Given the base path is "/api/svc1"
    When I GET "/api/svc1/v1/things"
    Then the response status should be 200
    And the response should be a JSON array with 3 items

  Scenario: BASE_PATH mounts the things count under a sub-path
    Given the base path is "/api/svc1"
    When I GET "/api/svc1/v1/things/count"
    Then the response status should be 200
    And the JSON property "count" should equal 3

  Scenario: BASE_PATH mounts the swagger explorer under a sub-path
    Given the base path is "/api/svc1"
    When I GET "/api/svc1/api-docs/"
    Then the response status should be 200

  Scenario: A trailing slash on BASE_PATH is tolerated
    Given the base path is "/api/svc1/"
    When I GET "/api/svc1/v1/things/count"
    Then the response status should be 200
    And the JSON property "count" should equal 3

  Scenario: The old un-prefixed routes are gone when BASE_PATH is set
    Given the base path is "/api/svc1"
    When I GET "/v1/things"
    Then the response status should be 404

  Scenario: The API key guard still applies under a base path
    Given the base path is "/api/svc1"
    And the API key is "test-secret"
    When I GET "/api/svc1/v1/things/count"
    Then the response status should be 401

  Scenario: The API key still unlocks the routes under a base path
    Given the base path is "/api/svc1"
    And the API key is "test-secret"
    When I GET "/api/svc1/v1/things/count" with api key "test-secret"
    Then the response status should be 200
    And the JSON property "count" should equal 3
