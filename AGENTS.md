# AGENTS.md

## Project

We are building a production-ready MVP for a corporate document-production platform.

The application allows non-technical case workers to author reusable Texts and complete Layouts. External systems discover document data requirements, provide data, and render documents.

The current repository originates from a Text-only proof of concept. We are evolving it into a real application, not starting over.

The system must prioritize:

- Correct domain semantics
- Simplicity and maintainability
- Deterministic rendering
- Historical reproducibility
- Case-worker usability
- Developer self-service
- Production reliability

## Your role

Act as a senior software engineer and architect.

Understand existing code before changing it. Prefer small, focused changes over broad rewrites.

Challenge unnecessary complexity. Do not introduce abstractions without a concrete need.

Do not make undocumented domain decisions or invent missing business rules.

For substantial tasks, inspect the relevant implementation, propose a short plan, and identify risks before making changes.

Follow the current task requirements rather than automatically implementing unrelated features.

## Architecture documentation

Read the relevant documents before modifying domain behavior:

- `docs/domain-model.md`
- `docs/tiptap-schema.md`
- `docs/contract-model.md`
- `docs/api.md`
- `docs/mvp-scope.md`

These documents describe domain requirements and design direction. Some originated during the POC and may require revision.

Do not silently choose between conflicting specifications.

Document significant architectural decisions and update the affected specifications when behavior changes.

Keep this file focused on engineering instructions. Detailed domain semantics belong in the architecture documents.

## Technology stack

### Frontend

Target stack:

- React with React Compiler
- TypeScript 7
- Vite
- TanStack Router
- Tiptap / ProseMirror
- Oxlint
- A consistent component library

Use supported stable releases and verify compatibility before upgrading.

Existing UI components may use MUI. Preserve the current working interface during migrations unless changes are explicitly requested.

Keep external component-library dependencies behind `src/components` where practical. Prefer thin wrappers over building a custom design system.

### Backend

- Go
- Modular monolith
- JSON over HTTP
- OpenAPI-defined interface
- Relational database, selected through an explicit architecture decision

Do not introduce microservices or distributed infrastructure without demonstrated requirements.

## Engineering boundaries

Keep these concerns separate where practical:

- Domain types and semantics
- Contract derivation and validation
- Rendering
- HTTP client and transport
- UI state and components
- Persistence and backend services

Domain logic must not depend on React, MUI, or Tiptap UI components.

Constrained HTML is the canonical authored content representation, including in the backend.

Tiptap/ProseMirror JSON is an editor implementation detail. Parse the documented HTML dialect structurally to derive semantics; do not infer domain meaning from visual labels or use raw string replacement.

## HTTP and API integration

The frontend must communicate through real HTTP requests using a coherent API client boundary.

Do not import MSW into application components or domain modules.

Use MSW only in development and testing to intercept HTTP requests and return representative responses.

Mock handlers should model the documented API contract, including representative failures, without becoming a competing implementation of production business logic.

The same frontend API client must work against MSW and the real backend.

### OpenAPI

Develop the OpenAPI specification iteratively from:

1. Domain requirements
2. Real authoring and rendering workflows
3. Frontend data requirements
4. External integration requirements
5. Validation and lifecycle semantics

Create an initial API contract before implementing corresponding HTTP mocks, then refine it as workflows are validated.

Once an API operation is agreed, its OpenAPI definition is authoritative for HTTP request and response shapes.

Generate TypeScript API types and/or clients from OpenAPI when practical.

Do not separately hand-maintain conflicting API types.

Use stable resource IDs, explicit operations, structured validation errors, and concurrency controls where required.

Do not expose frontend component state or database tables directly as API resources.

## Core domain invariants

These must be preserved during development.

### Texts

Texts support rich content, variables, reusable Text references, recursive references, and boolean-conditional inclusion.

Circular references are invalid.

Variables reference stable Data Field IDs.

### Layouts

Layouts have an owning team, layout type, and body/main/footer content.

Reuse existing Text authoring and composition semantics.

Only one published Layout may be active for a `(team, layoutType)` at a given applicable time.

Layouts are the eventual public rendering entry point.

### Data contracts

Document data requirements are derived recursively from authored content and dependencies.

Requiredness is derived, not manually configured by authors.

Nested boolean conditions must retain their complete condition semantics.

The backend is authoritative for production contract derivation and validation.

### Lifecycle

Texts and Layouts support the intended lifecycle:

Draft → Approved → Published → Archived

Published revisions are immutable.

Keep working drafts, draft edit history, published revisions, and generated document records conceptually separate.

### Temporal behavior

Production dependency resolution must select applicable immutable revisions deterministically.

Case workers must not need to manually pin dozens of referenced Text revisions.

Generated documents must record the exact resolved dependency graph, input data, renderer information, and relevant assets.

Never reproduce historical documents using today's latest dependencies.

Temporal resolution details not yet specified must be resolved explicitly before implementing production behavior.

### Business rules

Only boolean content-inclusion conditions are supported.

External systems determine business facts. The document platform controls presentation.

Do not implement a general business-rules engine.

## Layout authoring

Build Layout authoring on top of reusable editor and domain functionality.

The Layout workflow must support:

- Navigation and creation
- Team and layout-type information
- Body/main/footer composition
- Variables and reusable Text references
- Recursive contract inspection
- Preview
- Validation
- Lifecycle actions when implemented

Avoid creating a separate editor architecture for Layouts.

Preserve existing Text authoring interactions unless an intentional UX change is required.

## Implementation workflow

For each task:

1. Read the relevant documentation and code.
2. Establish existing behavior and identify regression risks.
3. Implement the smallest coherent change.
4. Add or update appropriate tests.
5. Run relevant type checking, linting, tests, and builds.
6. Review the diff.
7. Report results and remaining limitations.

Follow repository scripts and conventions. If required scripts are missing, propose suitable additions rather than inventing successful verification.

Treat toolchain migrations as separate, verifiable changes.

Do not combine unrelated dependency upgrades, architectural refactoring, and feature implementation in one task.

Do not overwrite or discard existing work without authorization.

## Testing

Prioritize tests for domain behavior rather than implementation details.

Important areas include:

- Recursive Text resolution
- Conditional requirements
- Cycle detection
- Missing and invalid fields
- Data contract derivation
- Render validation
- Layout composition
- Lifecycle transitions
- Temporal resolution
- Published revision immutability
- Historical reproduction
- HTTP contract compliance
- API error handling

Maintain shared semantic fixtures between frontend and backend.

Use MSW for frontend integration tests and representative HTTP scenarios.

Tests must remain deterministic and independent of external production services.

## Production requirements

Production readiness includes appropriate authentication, authorization, input validation, persistence, migrations, concurrency handling, auditing, logging, deployment, and recovery capabilities.

Implement these according to explicit MVP requirements and corporate infrastructure constraints.

Do not mistake an MSW-backed frontend prototype for a production-ready system.

Avoid unnecessary enterprise infrastructure.

## Definition of done

A task is complete when:

- Requested behavior works.
- Relevant existing behavior is preserved.
- Domain invariants remain valid.
- Appropriate tests are added or updated.
- Available checks have been executed.
- API definitions and documentation are updated when needed.
- No unrelated changes are introduced.
- Remaining issues are explicitly reported.

Production release readiness requires additional end-to-end, security, operational, and reproducibility verification.

Correctness and maintainability take precedence over novelty.