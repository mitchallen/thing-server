Feature: The OpenAPI spec describes the routes actually served
  The served collection's path and label come from the data file, so the spec
  is generated from that file rather than hardcoding /v1 and "things". A data
  set mounted elsewhere under a different name must document its own routes.

  Scenario: The default data set documents the things routes
    When I fetch the OpenAPI spec
    Then the spec should document the path "/"
    And the spec should document the path "/v1"
    And the spec should document the path "/v1/things"
    And the spec should document the path "/v1/things/count"
    And the spec should document the path "/v1/things/{id}"

  Scenario: The default data set documents a Thing schema drawn from the data
    When I fetch the OpenAPI spec
    Then the spec should define the schema "Thing"
    And the spec schema "Thing" should describe the property "title" as "string"
    And the spec schema "Thing" should describe the property "value" as "integer"

  Scenario: A data set with its own path and label documents those routes
    Given the things file is "./test/data/pets/things.json"
    When I fetch the OpenAPI spec
    Then the spec should document the path "/v2"
    And the spec should document the path "/v2/pets"
    And the spec should document the path "/v2/pets/count"
    And the spec should document the path "/v2/pets/{id}"

  Scenario: A data set with its own label no longer documents the default routes
    Given the things file is "./test/data/pets/things.json"
    When I fetch the OpenAPI spec
    Then the spec should not document the path "/v1"
    And the spec should not document the path "/v1/things"

  Scenario: The schema is named and typed from the data set being served
    Given the things file is "./test/data/pets/things.json"
    When I fetch the OpenAPI spec
    Then the spec should define the schema "Pet"
    And the spec schema "Pet" should describe the property "name" as "string"
    And the spec schema "Pet" should describe the property "age" as "integer"

  Scenario: Property types are derived from every entry, not just the first
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec should define the schema "Inventory"
    And the spec schema "Inventory" should describe the property "name" as "string"
    And the spec schema "Inventory" should describe the property "active" as "boolean"
    And the spec schema "Inventory" should describe the property "tags" as "array"
    And the spec schema "Inventory" should describe the property "meta" as "object"

  Scenario: An integer and a float in the same property widen to number
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec schema "Inventory" should describe the property "score" as "number"

  Scenario: A lone null does not decide a property's type
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec schema "Inventory" should describe the property "note" as "string"

  Scenario: Genuinely conflicting types claim no type at all
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec schema "Inventory" should claim no type for the property "mixed"

  Scenario: A property that is null in every entry claims no type
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec schema "Inventory" should claim no type for the property "blank"

  Scenario: A property present in only some entries is still documented
    Given the things file is "./test/data/mixed/things.json"
    When I fetch the OpenAPI spec
    Then the spec schema "Inventory" should describe the property "extra" as "string"

  Scenario: An empty data set documents an unconstrained item
    Given the things file is "./test/data/empty/things.json"
    When I fetch the OpenAPI spec
    Then the spec should document the path "/v4/s"
    And the spec should define the schema "Item"
    And the spec schema "Item" should have no properties

  Scenario: A custom data set serves its documented routes
    Given the things file is "./test/data/pets/things.json"
    When I GET "/v2/pets/count"
    Then the response status should be 200
    And the JSON property "count" should equal 4

  Scenario: A custom data set reports its label and path at the root
    Given the things file is "./test/data/pets/things.json"
    When I GET "/"
    Then the response status should be 200
    And the JSON property "meta.label" should equal "pets"
    And the JSON property "meta.path" should equal "/v2"
    And the JSON property "meta.count" should equal 4

  Scenario: The spec is served as JSON without an API key
    Given the API key is "test-secret"
    When I GET "/openapi.json"
    Then the response status should be 200

  Scenario: The served spec names this server with an absolute URL
    When I fetch the served OpenAPI spec
    Then the served spec server URL should be this server's address

  Scenario: The served spec server URL includes the base path
    Given the base path is "/api/svc1"
    When I fetch the served OpenAPI spec from "/api/svc1/openapi.json"
    Then the served spec server URL should be this server's address plus "/api/svc1"

  Scenario: Every operation can become a named tool
    When I fetch the served OpenAPI spec
    Then every operation should have a unique operationId

  Scenario: The operationIds follow the data set being served
    Given the things file is "./test/data/pets/things.json"
    When I fetch the served OpenAPI spec
    Then the operation at "/v2/pets" should have the operationId "listPets"
    And the operation at "/v2/pets/{id}" should have the operationId "getPetsById"

  Scenario: The collection routes declare the API key as a security scheme
    When I fetch the served OpenAPI spec
    Then the operations under "/v1" should require the apiKey security scheme
    And the root operation should not require a security scheme
    And no operation should take the API key as a parameter

  Scenario: The served spec server URL honors forwarded headers behind a proxy
    When I fetch the served OpenAPI spec with X-Forwarded-Proto "https, http" and X-Forwarded-Host "api.example.com"
    Then the served spec server URL should be "https://api.example.com"

  Scenario: A label with no letters or digits still gives a valid operationId
    Given the things file is "./test/data/symbols/things.json"
    When I fetch the served OpenAPI spec
    Then the operation at "/v1/---" should have the operationId "listItems"
