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
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
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
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

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
- Do not duplicate learning points already covered by other samples. If a concept is taught elsewhere (e.g. `reset()` / `dirty()` are in `settings`), link to that sample instead of re-explaining
- Sample README is learning content, not an implementation diary. Describe the Signal Forms API behavior; do not justify your design choices or narrate how the implementation evolved
- For conditional form samples, only include fields involved in the conditional logic
- Exclude unrelated noise (e.g., pizza menu selection unrelated to conditional branching)

## Dev Server Verification

- After `ng serve`, always verify via browser screenshot before reporting success
- Re-verify in the running browser after EVERY user-facing change to a sample (template, styles, exposed signals). A single initial verification does not cover subsequent edits — each edit needs its own check before reporting
- When a user reports a UI discrepancy (a feature still appearing, a state not clearing, etc.), suspect your own setup first: restart the dev server, remove the `.angular` cache, and verify the bundle reflects the source. Only after that should you consider downstream causes (browser cache, etc.). Do not deflect to the user's environment without checking your own
- If port is occupied, suspect a server from a different worktree
- Use `lsof -i :4200` to check process; kill and restart if needed
