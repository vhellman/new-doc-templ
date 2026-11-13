# Tiptap Schema

## Purpose

Defines the frontend authoring semantics that the Go backend must understand.

Exact implementation code may change. Semantic meaning should remain stable.

## Canonical authored representation

Use Tiptap/ProseMirror JSON as the canonical authored content representation.

HTML is an output/rendering representation.

Do not store domain meaning only in visual HTML.

## Variable node

A variable references one Data Field by stable ID.

Conceptual shape:

```json
{
  "type": "variable",
  "attrs": {
    "fieldId": "field-123"
  }
}
```

Display name, path, and type are resolved from the Data Field Catalogue.

Do not duplicate those values into the node unless needed purely for temporary UI resilience.

The stable field ID is authoritative.

Expected editor behaviour:

- inline atom/token
- selectable
- visually distinct
- selecting it opens Properties

## Text reference node

References another Text.

Unconditional conceptual shape:

```json
{
  "type": "textReference",
  "attrs": {
    "textId": "text-123",
    "conditionFieldId": null,
    "expectedValue": null
  }
}
```

Conditional conceptual shape:

```json
{
  "type": "textReference",
  "attrs": {
    "textId": "text-123",
    "conditionFieldId": "field-456",
    "expectedValue": true
  }
}
```

Rules:

- `conditionFieldId` must resolve to a boolean field.
- `expectedValue` is boolean when a condition exists.
- absence of a condition means always include.
- referenced Text is resolved recursively.

Expected editor behaviour:

- visually distinct from normal text
- selectable
- selecting opens Properties
- default insertion is unconditional

## Normal rich-text nodes

Use standard Tiptap/ProseMirror nodes where possible.

Initial POC may support:

- `doc`
- `paragraph`
- `text`
- `heading`
- `bulletList`
- `orderedList`
- `listItem`
- basic marks such as bold/italic

Do not expand the schema unless a real authoring need appears.

## Autocomplete semantics

Typing `$`:

- opens Data Field autocomplete
- existing fields can be inserted
- Create Variable action is always discoverable

Typing `#`:

- opens existing Text autocomplete
- does not create new Texts

Keyboard behaviour:

- ArrowUp / ArrowDown move selection
- Enter / Tab selects
- Escape closes
- editor caret should not move while autocomplete consumes these keys

## Variable creation

When author creates a new variable:

1. create a Data Field
2. generate stable field ID
3. generate initial API path
4. insert variable node referencing the field ID
5. open Properties

The node itself should not become the Data Field definition.

The catalogue remains the source of field metadata.

## Backend parsing

The Go backend must understand the same semantic node types.

Backend contract derivation should walk Tiptap JSON directly.

Do not convert to HTML and parse HTML to rediscover variables/references.

Pseudo traversal:

```text
walk(node):
  if variable:
      process fieldId

  if textReference:
      validate referenced Text
      validate optional boolean condition
      recurse into referenced Text

  recurse into normal child content
```

## Rendering

Rendering eventually converts the structured document to HTML.

Conceptually:

```text
Tiptap JSON
  -> resolve Text references
  -> evaluate boolean references
  -> resolve variables from request data
  -> render HTML
```

Do not make raw HTML string replacement the authoritative semantic engine.

## Compatibility

Frontend and backend should share fixtures containing Tiptap JSON.

Recommended fixture set:

1. Direct variable
2. Multiple variables
3. Unconditional Text reference
4. Nested Text reference
5. Conditional Text reference
6. Nested conditional reference
7. Missing Data Field
8. Missing Text
9. Circular Text reference
10. Non-boolean condition field

The same fixtures should be used to verify React-side and Go-side contract derivation semantics.
