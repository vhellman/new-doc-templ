# Domain Model

## Purpose

This document defines the core domain concepts for the document platform. It should remain implementation-neutral where possible.

## Core entities

### Team

Owns Texts, Layouts, and Data Fields.

Fields:

- `id`
- `name`
- `namespace`

A namespace is a stable technical identifier such as `team-a`, `legal`, or `corporate`.

Ownership and visibility are separate concerns. A Text may be owned by Legal and shared with other teams.

### DataField

Represents one piece of data that an external integration may provide.

Fields:

- `id` — stable internal identity
- `ownerTeamId`
- `displayName`
- `path` — API/data path, e.g. `customer.firstName`
- `type` — `string | number | date | boolean`
- `description`
- `status`
- timestamps

Rules:

- Templates reference `DataField.id`, not display name or path.
- External render payloads use `path`.
- Paths should be unique within the applicable catalogue scope.
- A case worker may create a field while authoring.
- The UI may auto-generate a path from the display name.
- Developers may later register fields/schema into the catalogue.

Important distinction:

- Catalogue = what data can be provided.
- Derived contract = what a specific Text/Layout requires.

### Text

Logical reusable content object.

Fields:

- `id`
- `ownerTeamId`
- `key`
- `displayName`
- `description`
- visibility/sharing metadata
- timestamps

A Text has revisions.

### TextRevision

Immutable once published in the production system.

Fields:

- `id`
- `textId`
- `status`
- `html` — canonical constrained HTML with stable-ID semantic elements
- `validFrom`
- `validTo`
- derived metadata / compiled contract
- timestamps
- author information

Production lifecycle:

`Draft -> Approved -> Published -> Archived`

POC may ignore lifecycle.

A revision may contain:

- normal rich text
- variables
- Text references
- conditional Text references

### Layout

Logical document layout.

Fields:

- `id`
- `ownerTeamId`
- `layoutType`
- `displayName`
- timestamps

Uniqueness rule for active content:

`(ownerTeamId, layoutType)`

Only one published Layout revision may be active for that pair.

### LayoutRevision

Immutable once published.

Fields:

- `id`
- `layoutId`
- `status`
- `body`
- `main`
- `footer`
- `validFrom`
- `validTo`
- derived metadata / compiled contract
- timestamps

Body/main/footer are Text-based document content.

The exact representation may later be either references to Text revisions or structured content containing Text references. The important production invariant is deterministic resolution.

### DocumentInstance

Represents one generated document.

Fields:

- `id`
- `layoutRevisionId`
- `generatedAt`
- `inputData`
- `resolvedDependencyRevisionIds`
- `rendererVersion`
- generated HTML
- generated PDF if applicable
- asset/style/font version metadata when required

Purpose:

Support exact historical reproduction and auditing.

## Dependency model

A Text may reference another Text.

Example:

```text
Payment Reminder
  -> Payment Information
       -> Corporate Footer
```

Dependencies may be nested recursively.

Circular dependencies are invalid:

```text
A -> B -> C -> A
```

Published dependencies must resolve deterministically to immutable revisions.

Do not resolve historical documents using "latest Text".

## Conditional references

For now, conditions apply only to Text references and use boolean fields.

Example:

```text
Representative Information
included when case.hasRepresentative = true
```

The case-management system decides the fact.

The document platform only decides whether to include the referenced Text.

Do not add business-rule evaluation to the document platform.

## Requiredness

Requiredness is derived.

Directly used variable:

```text
customer.firstName
```

=> always required.

Conditional reference:

```text
include Representative Information when case.hasRepresentative = true
```

Representative Information uses:

```text
representative.name
```

=> contract becomes:

Always required:

- `case.hasRepresentative`

Conditionally required:

- `representative.name` when `case.hasRepresentative = true`

Do not add a generic author-controlled "required" flag without defining missing-value semantics.

## Temporal semantics

Use temporal validity as the business model:

- `validFrom`
- `validTo`

Use immutable revision IDs as exact technical identity.

Temporal validity answers:

"What was active at time T?"

Revision IDs answer:

"What exact content was used?"

Both are useful and should coexist.
