# Contract Model

## Purpose

Defines how the platform derives the data contract required to render a Text or Layout.

This is the critical shared semantic between frontend and backend.

The exact JSON representation may evolve, but the rules in this document should remain stable unless deliberately changed.

## Inputs to contract derivation

For a Text revision:

- Tiptap/ProseMirror document
- Data Field Catalogue
- referenced Texts
- recursively referenced Texts
- boolean reference conditions

For a Layout revision:

- body/main/footer
- all referenced Texts
- recursively referenced Texts
- Data Field Catalogue

## Output concepts

The derived contract contains:

- always-required fields
- conditionally-required fields
- field type
- API/data path
- stable field ID
- condition metadata
- validation errors if derivation fails

Example conceptual contract:

```json
{
  "required": [
    {
      "fieldId": "field-customer-first-name",
      "path": "customer.firstName",
      "type": "string"
    },
    {
      "fieldId": "field-has-representative",
      "path": "case.hasRepresentative",
      "type": "boolean"
    }
  ],
  "conditional": [
    {
      "when": {
        "fieldId": "field-has-representative",
        "path": "case.hasRepresentative",
        "equals": true
      },
      "required": [
        {
          "fieldId": "field-representative-name",
          "path": "representative.name",
          "type": "string"
        }
      ]
    }
  ]
}
```

The exact shape is not final.

## Derivation rules

### Direct variable

If a Text directly contains a variable node for field `F`:

`F` is always required unless the current traversal is already inside a condition.

### Unconditional Text reference

If Text A unconditionally references Text B:

all requirements of Text B are merged into Text A.

Example:

```text
A -> B
B uses payment.amount
```

A requires:

```text
payment.amount
```

### Conditional Text reference

If A references B when boolean field `C = true`:

- `C` is always required
- requirements of B become required under condition `C = true`

Example:

```text
A
 -> B when case.hasRepresentative = true

B
 -> representative.name
```

Result:

Always:

- `case.hasRepresentative`

Conditional:

- `representative.name` when `case.hasRepresentative = true`

### Nested conditions

For the POC, avoid authoring nested condition logic.

If nested conditional references occur naturally through reused Texts, preserve the conjunction of conditions rather than inventing business logic.

Example:

```text
A -> B when flagA = true
B -> C when flagB = true
C uses x
```

`x` is required when:

```text
flagA = true AND flagB = true
```

The internal model should be able to represent this even if the UI does not encourage authoring it.

Do not simplify incorrectly to either condition alone.

## Deduplication

If the same field appears multiple times under the same requirement scope, emit it once.

If a field is both always required and conditionally required, always-required wins.

## Type conflicts

A field ID has one canonical type in the Data Field Catalogue.

If the same path resolves to conflicting field identities or incompatible types, derivation should fail rather than guess.

## Missing fields

If a variable node refers to a missing Data Field:

```json
{
  "code": "FIELD_NOT_FOUND",
  "fieldId": "field-123"
}
```

## Invalid condition field

A conditional reference must use a boolean Data Field.

```json
{
  "code": "CONDITION_FIELD_NOT_BOOLEAN",
  "fieldId": "field-123"
}
```

## Missing Text reference

```json
{
  "code": "TEXT_REFERENCE_NOT_FOUND",
  "textId": "text-123"
}
```

## Circular reference

Detect cycles during traversal.

```json
{
  "code": "TEXT_REFERENCE_CYCLE",
  "path": ["text-a", "text-b", "text-c", "text-a"]
}
```

## Render validation

At render time:

1. Load authoritative derived contract.
2. Validate supplied data.
3. Evaluate boolean conditions.
4. Require only conditionally reached fields.
5. Render.

Example:

```json
{
  "data": {
    "case": {
      "hasRepresentative": false
    }
  }
}
```

If `representative.name` is required only when `hasRepresentative = true`, its absence is valid here.

## Frontend/backend consistency

Frontend may derive contracts for immediate UX.

Backend is authoritative.

Maintain shared fixtures that both implementations must satisfy.

Recommended fixture:

```text
Text A:
- customer.firstName
- Text B when case.hasRepresentative = true

Text B:
- representative.name
```

Expected:

Always:

- customer.firstName
- case.hasRepresentative

Conditional:

- representative.name when case.hasRepresentative = true

Both implementations should produce equivalent semantics.
