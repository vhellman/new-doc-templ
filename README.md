# Document template POC

A browser-only Text authoring and integration prototype, reconstructed from the MUI v7 source. Run with `npm install && npm run dev` or `pnpm install && pnpm dev`.

## Try the complete flow

The Text workspace is available at `/texts`; `/` redirects there. Use the header navigation to switch to `/layouts`, which currently contains a placeholder for future Layout authoring. Unknown URLs show a not-found page. Hosting must serve `index.html` for application routes so direct links and refreshes work.

1. Open **Payment reminder**. Type `$` in a paragraph to insert or create a variable. Type `#` on an empty paragraph to insert an existing reusable Text. Create new Texts with the **+** in navigation.
2. Select a variable or reference. Properties edits the Data Field metadata or makes a reference conditional on a boolean field.
3. Click **Preview**. The form comes from recursively derived requirements. Change **Has representative** to see its conditional fields and nested Text disappear or appear.
4. Open **Integration** with `</>`. It shows the complete required data, a `POST /texts/{id}/render` example, the raw contract, and the canonical HTML. Try a modified JSON request.
5. Create a variable while writing, or add its path and type first in **Register team data fields**. Both routes create fields in the same team catalogue.

Texts and Data Fields are saved in browser localStorage in this POC. Clear site data to reset the seed. It has one sample team (`claims`) and deliberately has no backend, Layouts, publishing workflow, authentication, or PDF service.

## Representation and semantics

`TextTemplate.html` is canonical. It contains ordinary constrained HTML plus `<doc-variable field-id="…"></doc-variable>` and `<doc-text-ref text-id="…" condition-field-id="…" expected-value="true"></doc-text-ref>`. Editor labels are derived from the team's Data Field catalogue and stripped when saving HTML. No `${path}` or `#{text}` text parsing is used. The DOM walker recursively derives the contract; the renderer uses the same IDs and escapes supplied data. Cycles, missing references, invalid conditions, duplicate paths, and unknown fields become validation issues.

The browser implementation tests the product flow, not production authority. A Go backend should parse and validate this exact HTML dialect on save and render, pin published dependencies and field semantics to immutable revisions, and retain the renderer and assets needed for reproduction. Production's public render entry point is a Layout; Text rendering here is preview and integration tooling.
