# API Direction

## Purpose

Defines the expected developer-facing API direction.

The initial proposed authoring BFF contract is `../api/openapi.json`; its operation inventory, scope and unresolved decisions are in `../api/README.md`. Once agreed, that OpenAPI document is authoritative for HTTP shapes. Examples below describe product direction and must not override the concrete authoring contract. Layout production operations remain deferred.

The production API should prioritize self-service and clear contracts.

## General principles

- JSON over HTTP initially.
- Stable IDs in URLs.
- Nested request data matching field paths.
- Clear validation errors.
- Backend-derived contracts are authoritative.
- Layout is the eventual production rendering entry point.
- Text-level render endpoints may exist for preview/tooling.

## Data catalogue

### List/search fields

```http
GET /data-fields?query=customer
```

Example response:

```json
{
  "items": [
    {
      "id": "field-1",
      "displayName": "Customer first name",
      "path": "customer.firstName",
      "type": "string",
      "description": "Customer given name"
    }
  ]
}
```

### Create field

```http
POST /data-fields
```

```json
{
  "displayName": "Payment due date",
  "path": "custom.paymentDueDate",
  "type": "date",
  "description": "Date payment is due"
}
```

The final authorization/governance model is TBD.

## Texts

### List Texts

```http
GET /texts
```

### Get Text

```http
GET /texts/{textId}
```

### Save Text draft

```http
PUT /texts/{textId}/draft
```

Conceptual request:

```json
{
  "displayName": "Payment reminder",
  "html": "<p></p>"
}
```

Important:

The frontend sends canonical constrained HTML. Tiptap JSON is an editor detail.

The backend derives the contract itself.

Do not send a frontend-generated contract as authoritative state.

The backend may return derived metadata for immediate display:

```json
{
  "draft": {
    "id": "text-123",
    "ownerTeamId": "claims",
    "displayName": "Payment reminder",
    "html": "<p></p>"
  },
  "contract": {
    "textId": "text-123",
    "valid": true,
    "requirements": [],
    "referencedTextIds": [],
    "validationIssues": []
  }
}
```

## Text contract

Useful for POC and tooling:

```http
GET /texts/{textId}/contract
```

Returns the backend-authoritative derived contract.

## Text rendering

Useful for Preview and developer tooling:

```http
POST /texts/{textId}/render
```

Request:

```json
{
  "data": {
    "customer": {
      "firstName": "Anna"
    },
    "case": {
      "hasRepresentative": true
    }
  }
}
```

Possible response:

```json
{
  "html": "<p>Hello Anna</p>"
}
```

This endpoint is not necessarily the final public production document API.

## Layouts

The eventual production entry point.

### Get Layout contract

```http
GET /layouts/{layoutId}/contract
```

Returns the complete recursively derived data requirement.

The caller should not need to know which nested Text introduced each field.

### Render Layout

```http
POST /layouts/{layoutId}/render
```

Request:

```json
{
  "data": {
    "customer": {
      "firstName": "Anna"
    },
    "case": {
      "caseNumber": "ABC-123"
    }
  }
}
```

Response may eventually contain:

```json
{
  "documentId": "doc-123",
  "html": "...",
  "pdf": null
}
```

Exact response shape TBD.

## Validation errors

Prefer machine-readable error codes with human-readable messages.

Example:

```json
{
  "error": {
    "code": "MISSING_REQUIRED_DATA",
    "message": "Required render data is missing.",
    "details": [
      {
        "path": "customer.firstName",
        "reason": "required"
      }
    ]
  }
}
```

Conditional example:

```json
{
  "error": {
    "code": "MISSING_CONDITIONAL_DATA",
    "details": [
      {
        "path": "representative.name",
        "requiredWhen": {
          "path": "case.hasRepresentative",
          "equals": true
        }
      }
    ]
  }
}
```

## Historical rendering

Production-generated documents should record exact revision identities.

Do not implement historical reproduction by calling today's Layout endpoint with an old timestamp and hoping current dependencies resolve correctly.

A future endpoint may support retrieval/regeneration by `documentId`.

## Schema registration

Developers may eventually register available schema/data into the catalogue.

Do not let this become a second document contract.

Registered schema means:

"What can my integration provide?"

Derived Layout/Text contract means:

"What does this document require?"

A future import endpoint may accept JSON Schema or another schema format, but this should be decided only after testing real integration workflows.
