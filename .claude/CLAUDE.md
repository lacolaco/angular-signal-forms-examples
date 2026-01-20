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

- Include only fields related to the learning point
- For conditional form samples, only include fields involved in the conditional logic
- Exclude unrelated noise (e.g., pizza menu selection unrelated to conditional branching)

## Dev Server Verification

- After `ng serve`, always verify via browser screenshot before reporting success
- If port is occupied, suspect a server from a different worktree
- Use `lsof -i :4200` to check process; kill and restart if needed
