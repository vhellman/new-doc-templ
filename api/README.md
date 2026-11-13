# Authoring BFF contract

[openapi.json](openapi.json) is the proposed OpenAPI 3.1.2 contract for replacing the browser-only persistence and semantic services used by the current frontend. JSON is a standard OpenAPI serialization: the file can be consumed directly by validators, documentation tools and TypeScript generators. This is a design artifact, not an implemented backend or a production release contract.

The proposed mount is `/api`. Paths below are relative to it. No application code, HTTP client or mocks have been changed by this task.

## Endpoint inventory and code trace

| Method | Path | Workflow and implementation evidence |
| --- | --- | --- |
| GET | `/teams` | Discover ownership context instead of the hardcoded `TEAM_ID` in `src/domain/seed.ts` and `src/domain/factories.ts`. Proposed support operation; no team selector exists yet. |
| GET | `/texts` | Navigation and `#` suggestions: `TextNavigation.tsx`, `editor/autocomplete.ts`. |
| POST | `/texts` | Add Text: `TextsPage.addText`, `createTextTemplate`. |
| GET | `/texts/{textId}` | Open Text or shared Text; load canonical HTML, metadata, initial recursive contract and an edit validator. `TextsPage.tsx`, `useTextEditor.ts`, `TextInspector.tsx`. |
| PUT | `/texts/{textId}/draft` | Rename and save content, variable insertion/removal, reference insertion/removal and boolean condition edits. `renameSelectedText`, editor `onUpdate`, `PropertiesPanel`. |
| GET | `/texts/{textId}/contract` | Field/reference counts, validation messages, recursive requirements, preview form and Integration raw contract: `lib/contract.ts`, `TextEditorWorkspace.tsx`, `TextInspector.tsx`, `PreviewModal.tsx`, `IntegrationPanel.tsx`. |
| POST | `/texts/{textId}/render` | Case-worker preview and integration request testing: `PreviewModal.tsx`, `IntegrationPanel.tsx`, `lib/render.ts`. Same operation for both. |
| GET | `/data-fields` | `$` suggestions, catalogue resolution and boolean condition choices: `editor/autocomplete.ts`, `TextInspector.tsx`. |
| POST | `/data-fields` | Create variable while writing: `createAndInsertField`, `createDataField`. |
| GET | `/data-fields/{fieldId}` | Read individual Properties metadata and its edit validator; the current UI looks up fields in its in-memory catalogue. |
| PATCH | `/data-fields/{fieldId}` | Display name, path, type and description edits: `PropertiesPanel`, `useTextEditor.updateField`. |
| POST | `/data-fields/register` | Atomic path-to-type registration: `IntegrationPanel.registerSchema`, `TextsPage.registerFields`. |

Autocomplete filtering, editor selection, rich-text commands, inspector visibility, example payload generation (`lib/payload.ts`), and active preview-form fields remain client behavior. They do not need separate HTTP operations. References and their conditions are embedded in authored HTML, so no reference CRUD endpoints are necessary. Removing a token/reference saves the Text; it does not delete a catalogue field or another Text.

## Proposed wire decisions

These choices make the first contract concrete and reviewable; they are proposals rather than claims about an existing server.

- `ownerTeamId` and `displayName` follow the domain documentation. Adapt current `teamId`, Text `name` and field `label` at the future API boundary. Do not introduce another hand-maintained TypeScript API model; generate it from the agreed specification.
- Backend content is canonical constrained HTML with stable `field-id` / `text-id` attributes. Tiptap is an editor implementation detail. See [the HTML/editor specification](../docs/tiptap-schema.md).
- IDs are server-assigned and opaque. Creation returns `201`, `Location` and the resource. Text names do not define identity. Ownership cannot be reassigned by these operations.
- Lists use cursor pagination with explicit ownership scope (except team discovery). Search matches current autocomplete fields. Fetch every page when maintaining a complete client catalogue. No cross-team sharing policy is inferred from the single-team POC.
- A Text read/write returns its draft and authoritative contract. A dedicated contract read supports refresh and developer tooling without resending HTML. Draft ETags do not certify the dependency graph; contract/render each read a coherent current graph and catalogue, and rendering validates again.
- Reads and writes of individual mutable drafts/fields return a strong ETag. Updates require its exact `If-Match`: missing `428`, stale `412`, malformed `400`. A stale write must not overwrite newer work. List items do not carry edit validators; read the individual field before modifying it.
- Unsafe/unsupported HTML and invalid request shapes yield `422` without a save. Valid dialect HTML with semantic issues is saved as editable draft content and returns `contract.valid=false` plus issues. Requirements in invalid contracts may be partial. This retains the current ability to edit incomplete documents without treating them as renderable.
- Registration retains the existing map-of-path-to-type input and all-or-nothing behavior. Re-registering matching types does not edit existing metadata. A conflict returns `409` with path details. Generated field paths/display names follow the current factories/registration behavior. This is not a JSON Schema importer.
- Render uses saved working drafts. The client must flush pending field and Text saves before analysis/render. It returns validated HTML or a structured `422`, improving on the POC's inline error placeholders. There is no production document record or published dependency selection here.
- `requiredWhen` is an OR of AND paths. `[[]]` means always required; an unconditional occurrence supersedes conditional occurrences. A nested condition's own boolean field is required only under its ancestor conditions. Values are validated only when reached. Conditions compare actual booleans, never truthy strings.
- Reached `null`, missing values and empty strings are invalid; `false` and `0` are valid. Dates are full-date strings, numbers are JSON numbers, and strings/booleans retain their JSON types. Unused payload properties are ignored. `data` must be an object. These server rules are stricter than the POC renderer and need semantic fixtures when implemented.

## Error vocabulary

All errors use `{ "error": { "code", "message", "details": [] } }`. Details are structured issues with optional field/Text identity, request JSON Pointer, data path, condition paths or reference-cycle path. Derivation issues use the same issue schema in `contract.validationIssues`; transport errors are never disguised as successful contracts.

Initial issue codes for the implementation are `FIELD_NOT_FOUND`, `TEXT_REFERENCE_NOT_FOUND`, `TEXT_REFERENCE_CYCLE`, `CONDITION_FIELD_NOT_BOOLEAN`, `INVALID_CONDITION_VALUE`, `INVALID_DATA_PATH`, `DUPLICATE_DATA_PATH`, `INVALID_HTML`, `MISSING_REQUIRED_DATA`, `INVALID_DATA_TYPE`, and `FIELD_TYPE_CONFLICT`. The `code` schema intentionally remains an extensible string; clients should handle unknown codes. HTTP envelope codes are illustrated in the specification's reusable error responses. Contract `valid` must equal whether `validationIssues` is empty.

## Deferred endpoint map

These belong to the documented product direction, but have no implemented workflow or settled semantics in this codebase. They are deliberately not executable operations in this OpenAPI document.

| Capability | Candidate operations | Decisions needed before request/response contracts |
| --- | --- | --- |
| Layout authoring | `GET/POST /layouts`, `GET /layouts/{layoutId}`, `PUT /layouts/{layoutId}/draft` | Body/main/footer composition representation, layout-type catalogue and workflow. `LayoutsPage.tsx` is only a placeholder. |
| Layout analysis/preview | `GET /layouts/{layoutId}/contract`, `POST /layouts/{layoutId}/preview` | Composition and coherent draft dependency resolution. |
| Public document generation | `POST /layouts/{layoutId}/render` and active Layout discovery by team/type | Applicable-time selection, immutable resolution, active `(team, layoutType)` uniqueness, persisted generation records, renderer/assets and optional PDF behavior. Must not reuse draft preview semantics. |
| Lifecycle actions | Explicit approve, publish and archive operations for Texts/Layouts | Authorization, approval invalidation, immutable revision creation, effective-date boundaries, overlap handling and concurrency. |
| History and reproduction | Revision/history reads; `GET /documents/{documentId}` and possible regeneration operation | Draft history vs published revisions vs generated records, exact dependency graph, captured inputs and asset retention. Never resolve historical documents against current drafts. |
| Authentication and authorization | Session/identity operations if the corporate BFF deployment needs them | Corporate SSO/session model, CSRF policy if using cookies, roles, team membership and visibility. No arbitrary bearer/cookie scheme is invented here. All proposed operations require authenticated, authorized access; security wiring must be specified before production. |
| Catalogue governance | Optional deletion, retirement, sharing or schema import | Referenced-field safety, published field identity/type/path versioning, cross-team ownership and scope, prefix-colliding paths such as `a.b` and `a.b.c`. |

No team CRUD, delete Text, delete field, PDF, export, publish, historical render or general rules-engine endpoints are justified by the current UI. `docs/mvp-scope.md` is absent, so this inventory must not be treated as a complete production MVP scope.

## Validation

Run structural/reference validation and request/response/schema-example checks with:

```sh
npx @redocly/cli lint --config api/redocly.yaml api/openapi.json
```

The configuration disables the security-declaration rule only because authentication transport is explicitly unresolved; it is not an anonymous-access policy. A security scheme must be added when that decision is made. No frontend build or dependency changes are needed for this documentation-only contract. Backend/frontend shared fixtures and HTTP compliance tests should be added when the corresponding implementation is introduced.

Format reference: [OpenAPI 3.1.2](https://spec.openapis.org/oas/v3.1.2.html).
