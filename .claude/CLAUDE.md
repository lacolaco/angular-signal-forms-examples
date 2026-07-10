**CRITICAL: This file MUST be written in English only. All additions and modifications must be in English.**

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Git Workflow

**CRITICAL: Create worktree BEFORE writing any code. Working on main is absolutely forbidden. If violated, immediately stash and migrate to worktree.**

1. **NEVER commit directly to main** - Always create a feature branch
2. Use `git wt <branch-name>` to create worktree for new features
3. Work in the worktree directory (`/tmp/{repo}-wt/{branch}`)
4. Commit, push, and create PR from the worktree
5. Delete worktree after PR is merged (`git wt -d <branch>`)

### Commit Rules

- **Split by logical units**: Separate commits for dependency additions, config changes, UI changes, and feature additions
- **No bulk commits**: Do not use `git add -A && git commit` to commit all changes at once

### Pre-PR Self-Review Checklist (Required)

Before creating a PR, verify:
- [ ] `/code-review` passed (mandatory for all code changes per `~/works/CLAUDE.md`)
- [ ] Comments and JSDoc are in Japanese (project language)
- [ ] Auto-generated files (e.g., mockServiceWorker.js) are added to .gitignore
- [ ] Commits are split into logical units
- [ ] No debug code remains

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Define shared structures as `interface` and reuse them. Never duplicate type definitions.
- Extract domain logic (parsing, formatting, validation) as pure functions for testability and reuse

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator. It's the default in Angular v22+
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for all new forms
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- Use `viewChild.required()` for template references that are guaranteed to exist (non-nullable)

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- Use `linkedSignal()` when internal state needs to sync with external signal but remain writable (avoids effect() + signal() pattern)

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Prefer the `@Service()` decorator (from `@angular/core`) over `@Injectable({ providedIn: 'root' })` in v22+. `@Service()` registers in the root `EnvironmentInjector` and is tree-shakable by default
- Use the `inject()` function instead of constructor injection

## Build System

- The application builder uses esbuild, NOT Vite. Vite-specific import suffixes like `?raw` are NOT supported
- To import non-JS files as text (e.g. `*.md`), declare them in `angular.json` build options: `"loader": { ".md": "text" }`, and declare the module type in a `.d.ts` (e.g. `declare module '*.md' { const content: string; export default content; }`). The `unit-test` builder inherits build options via `buildTarget`, so do NOT duplicate `loader` under the test target

## Testing

- Use Angular Testing Library for component tests
- To test `model()` two-way binding, use `twoWayBinding` from `@angular/core` with `bindings` option:
  ```typescript
  import { signal, twoWayBinding } from '@angular/core';
  const value = signal(0);
  await render(Component, { bindings: [twoWayBinding('value', value)] });
  ```
- Do NOT use harness components, `componentInstance`, or `componentProperties` for model testing
- For focus behavior, write integration tests verifying `focusBoundControl()` moves focus correctly
- Do NOT rely solely on unit tests for focus behavior; always verify in browser

## Form Patterns

- For submitted data display, store a snapshot at submit time using a signal (not the live model value)
- Use `submittedValue` signal with `null` for unsubmitted state; non-null means submitted

## Signal Forms Constraints

- `[disabled]` cannot be used with `[formField]` directive
- Restrict options via conditional rendering (`@if`) on option elements
- Remove unavailable options from UI instead of showing validation errors
- Keep select element even with single option; avoid disabled/readonly complexity

### Custom Control Focus

- Custom controls implementing `FormValueControl` must define a `focus()` method for `focusBoundControl()` to work
- Use `viewChild.required()` to reference the focusable input element
- `focusBoundControl()` automatically calls the custom control's `focus()` method

## Sample Implementation Principles

- Before writing any code in a new sample, read at least two existing sample READMEs (e.g. `simple-signup`, `book-review`, `settings`) to absorb the established style: brief 概要, plain-bullet 学習ポイント, code-anchored 実装の要点, no editorializing about design choices, no cross-sample comparisons in prose
- Fix the learning points BEFORE implementation and treat them as the scope contract. Every artifact in the sample — fields, signals, UI elements, handlers, helpers, schema rules, sample README sections — must map to at least one learning point. Anything else is noise and must not be added speculatively
- This applies to UI affordances too, not only data fields. Status badges (Valid / Invalid / Unsaved), per-section action buttons (Reset section), baseline-tracking helpers (linkedSignal mirrors of submittedValue) are noise unless they directly demonstrate a stated learning point
- Apply the learning-point-mapping check at the moment you propose the field list to the user, not after implementation. If a field name exists only to make the scenario "natural" (purpose, comment, free-text notes), drop it and pick a shorter scenario instead of carrying speculative fields into the spec / impl / README that you then have to delete
- When proposing scenarios to the user, include candidates from at least two different domains (business / consumer-facing / numeric-integrity / date-range / etc.) so the proposal does not collapse to the agent's own taste. The user can reject the angle wholesale ("change the framing") and that costs less when alternatives were already on the table
- Do not duplicate learning points already covered by other samples. If a concept is taught elsewhere (e.g. `reset()` / `dirty()` are in `settings`), link to that sample instead of re-explaining
- Sample README is learning content, not an implementation diary. Describe the Signal Forms API behavior; do not justify your design choices or narrate how the implementation evolved
- For conditional form samples, only include fields involved in the conditional logic
- Exclude unrelated noise (e.g., pizza menu selection unrelated to conditional branching)
- Before starting a new sample, run `gh pr list --state merged` and read at least one recent sample-addition PR to learn the established delivery checklist (files touched, documentation updated). Do not assume you know the full scope from memory
- When the sample uses a Signal Forms API, read its type definition (`node_modules/@angular/forms/types/`) to understand the full signature — including callback parameters and option objects — before choosing the implementation pattern. An initial Explore agent's findings must be reviewed and applied at implementation time, not forgotten
- New sample completion checklist (all items required before PR):
  1. Component + test + README in `examples/<name>/`
  2. Route in `app.routes.ts`
  3. Nav item in `app.ts`
  4. MSW handler (if HTTP is used) in `src/mocks/handlers.ts`
  5. `README.md` and `README.en.md`: Examples table row, learning order, API cross-reference
  6. `/code-review` pass (after every substantive code change, not just the initial implementation)

## Japanese Content Review

The built-in `/code-review` covers implementation / design only and runs in English; it does not catch Japanese-language defects. Before opening a PR for any sample whose user-visible content is in Japanese (validation messages, sample README, JSDoc, spec describe/it labels), do one independent read-through of every Japanese string with these checks:

- Adverb-verb pairing actually parses (e.g. 「複数返せ」 — `複数` is adverbial, `返せ` collides between imperative and capability; rewrite as 「複数件返せる」 or split the sentence)
- No ambiguity between imperative (〜してください) and capability (〜できる) forms when the intent is description, not instruction
- Validator messages name the object being constrained (「今日以降の日付を指定してください」, not 「今日以降を指定してください」 — `以降` is a time range, the object is missing)
- Punctuation is consistent within a file: half-width `()` vs full-width `（）` — pick one (this project uses half-width) and do not mix
- Register is consistent within an artifact type: validator messages 敬体, JSDoc / README / spec labels 常体. Do not mix within a file

## Dev Server Verification

- After `ng serve`, always verify via browser screenshot before reporting success
- Re-verify in the running browser after EVERY user-facing change to a sample (template, styles, exposed signals). A single initial verification does not cover subsequent edits — each edit needs its own check before reporting
- When a user reports a UI discrepancy (a feature still appearing, a state not clearing, etc.), suspect your own setup first: restart the dev server, remove the `.angular` cache, and verify the bundle reflects the source. Only after that should you consider downstream causes (browser cache, etc.). Do not deflect to the user's environment without checking your own
- If port is occupied, suspect a server from a different worktree
- Use `lsof -i :4200` to check process; kill and restart if needed
