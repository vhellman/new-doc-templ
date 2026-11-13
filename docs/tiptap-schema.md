# Canonical HTML and editor schema

## Representation decision

Canonical authored content, including backend storage and API payloads, is a constrained HTML fragment. This follows the product decision to keep the backend independent of Tiptap/ProseMirror JSON. Tiptap remains the current editor; its JSON and node views are implementation details. This supersedes the previous JSON-canonical direction.

`src/lib/html.ts` currently canonicalizes the fragment; `src/lib/contract.ts` and `src/lib/render.ts` walk parsed HTML. The Go backend must implement the same semantic dialect using an HTML parser, not regular-expression extraction or raw string replacement. The backend is authoritative for validation, contract derivation and rendering.

## Ordinary content

The current persisted/rendered tag set is `p`, `h1`–`h6`, `strong`, `em`, `s`, `code`, `blockquote`, `ul`, `ol`, `li`, `br`. Ordinary attributes are not part of this dialect. Do not expand the schema without an authoring need. Scripts, event handlers, style attributes, arbitrary URLs and editor node-view markup are not canonical content.

The proposed BFF rejects unsupported or unsafe markup with structured `INVALID_HTML` issues. The browser POC currently strips attributes and unwraps unknown elements; that permissive sanitizer is not a sufficient production validator. Canonicalization details and parser-normalization fixtures must be verified when the backend is implemented.

## Semantic elements

Inline variable:

```html
<doc-variable field-id="field-123"></doc-variable>
```

Unconditional block Text reference:

```html
<doc-text-ref text-id="text-123"></doc-text-ref>
```

Conditional block Text reference:

```html
<doc-text-ref text-id="text-123" condition-field-id="field-456" expected-value="true"></doc-text-ref>
```

Variables require a nonempty stable Data Field ID. References require a nonempty stable Text ID. Semantic elements have no authored child content. An unconditional reference has neither condition attribute. A conditional reference has both attributes: `condition-field-id` resolves to a boolean Data Field and `expected-value` is exactly `true` or `false`. Missing/invalid semantic attributes yield validation issues; the backend must not silently invent a boolean value.

Display names, paths, types and descriptions come from the catalogue. Referenced Text names come from the Text resource. Editor hints such as `data-label`, selection classes and condition labels are never authoritative or persisted. Removing a variable/reference edits the HTML, not the catalogue or referenced Text.

Text references resolve recursively; cycles are invalid. Nested conditional references preserve all ancestor conditions. The platform controls presentation using external boolean facts; it does not evaluate a general business-rules language.

## Editor behavior

- Variables are selectable inline atoms; Text references are selectable block nodes. Selecting either opens Properties.
- `$` opens Data Field suggestions and a discoverable Create Variable action. Creation first registers a field, then inserts its stable ID.
- `#` on an empty paragraph opens existing Text suggestions and does not create Texts.
- Arrow keys navigate suggestions; Enter/Tab selects; Escape closes. Consumed keys do not move the caret.
- New Text references are unconditional. Properties can select a boolean field and expected value.
- Saving removes temporary editor presentation attributes. Rendering escapes supplied variable values as text.

## Compatibility fixtures

Backend/frontend shared fixtures should use canonical HTML, catalogue entries and referenced Texts. Include direct/multiple variables, unconditional/nested references, conditional/nested conditions, missing fields/Texts, cycles, non-boolean guards, invalid expected values, stripped editor hints, rejected unsafe markup and escaped input data. Include false/zero and missing conditional values. No fixture suite exists yet.

See `../api/openapi.json` for proposed authoring request/response shapes and `contract-model.md` for derivation semantics. Production immutable dependency and historical rendering policies remain separate decisions.
