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
