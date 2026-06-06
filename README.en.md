# Signal Forms Examples

[日本語](./README.md)

A collection of examples for learning **Signal Forms** (`@angular/forms/signals`) in Angular 22.

## What are Signal Forms?

A signal-based form management feature introduced in Angular 22. It takes a different approach from traditional Reactive Forms and Template-driven Forms.

- **Signal-based state management**: `valid()`, `touched()`, `errors()` are exposed as signals
- **Type-safe**: Form types are automatically inferred from initial values
- **Reactive validation**: No `updateValueAndValidity()` needed. Validation re-runs automatically on value changes
- **Zero subscriptions**: No Observable subscribe/unsubscribe required

## Setup

```bash
npm install
ng serve    # http://localhost:4200/
ng test     # Run tests with Vitest
```

## Examples

| # | Example | Topic | Key Concepts | Docs | Demo |
|---|---------|-------|-------------|------|------|
| 1 | Simple Signup | Basic Form | Basic pattern with `form()`, `validate()`, `required()`, `submit()` | [Docs](src/app/examples/simple-signup/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/simple-signup) |
| 2 | Account Settings | Nested Model | Path traversal on a nested model, group-level `valid()` / `dirty()` aggregation, subtree-scoped `reset()`, sub-schema reuse with `schema()` + `apply()` | [Docs](src/app/examples/account-settings/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/account-settings) |
| 3 | Book Review | Custom Control | Star rating control with `FormValueControl<number>` | [Docs](src/app/examples/book-review/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/book-review) |
| 4 | Profile Edit | Async Validation | Username duplicate check with `validateHttp()`, `pending()` state | [Docs](src/app/examples/profile-edit/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/profile-edit) |
| 5 | Pizza Order | Conditional Form | Dynamic fields based on delivery method with `applyWhen()`, `hidden()` | [Docs](src/app/examples/pizza-order/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/pizza-order) |
| 6 | Event Registration | Array Form | Dynamic attendee list with `applyEach()` | [Docs](src/app/examples/event-registration/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/event-registration) |
| 7 | Checkout | Custom Control | Expiration date input with `FormValueControl<string>` + `linkedSignal()` | [Docs](src/app/examples/checkout/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/checkout) |
| 8 | Location Select | Cascade Select | Cascading region/country/city selects with `computed()` | [Docs](src/app/examples/location-select/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/location-select) |
| 9 | City Search | Autocomplete | Accessible autocomplete with `@angular/aria` Combobox + `httpResource()` | [Docs](src/app/examples/city-search/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/city-search) |
| 10 | Avatar Upload | Custom Control | Image preview with `FormValueControl<File \| null>` + `resource()` | [Docs](src/app/examples/avatar-upload/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/avatar-upload) |
| 11 | Settings | Form Reset | Initial value restoration with `reset()`, change detection with `dirty()` | [Docs](src/app/examples/settings/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/settings) |

### Recommended Learning Order

1. **Getting Started**: Simple Signup (flat model) → Account Settings (nested model) to understand the basic shape of `form()`
2. **Validation**: Profile Edit (async), Pizza Order (conditional), Event Registration (array)
3. **Custom Controls**: Book Review → Checkout → Avatar Upload (progressive complexity)
4. **External Data**: Location Select, City Search
5. **Form State Management**: Settings — `reset()` and `dirty()` at the field level

## Signal Forms API Cross-Reference

| API | Description | Used In |
|-----|-------------|---------|
| `form()` | Form definition | All examples |
| `FormField` | Two-way binding directive | All examples |
| `submit()` | Form submission (with validation) | All examples |
| `required()` | Required validator | Simple Signup, Profile Edit, Event Registration, Location Select, City Search |
| `email()` | Email validator | Simple Signup |
| `minLength()` / `maxLength()` | Length validators | Profile Edit, Book Review |
| `pattern()` | Regex validator | Profile Edit |
| `validate()` | Custom validator | Simple Signup, Pizza Order, Book Review, Avatar Upload |
| `validateHttp()` | HTTP async validator | Profile Edit |
| `applyWhen()` | Conditional schema application | Pizza Order |
| `hidden()` | Conditional field hiding | Pizza Order |
| `applyEach()` | Array element validation | Event Registration |
| `debounce()` | Schema-level input debounce | Profile Edit |
| `valueOf()` | Reference other field values | Pizza Order |
| `pending()` | Async validation in-progress state | Profile Edit |
| `focusBoundControl()` | Focus control on validation error | All examples |
| `reset()` | Reset form values and state (works on sub-trees too) | Settings, Account Settings |
| `dirty()` | Change detection signal (aggregates children on groups) | Settings, Account Settings |
| `valid()` | Validity signal (aggregates children on groups) | All examples (Account Settings showcases group aggregation) |
| `schema()` | Define a reusable sub-schema | Account Settings |
| `apply()` | Attach an existing schema to a path | Account Settings |
| `FormValueControl<T>` | Custom control interface | Book Review, Checkout, Avatar Upload |

## Project Structure

```
src/app/
├── app.ts              # Root component (navigation)
├── app.routes.ts       # Route definitions (lazy loading)
├── examples/           # Example implementations (feature-based)
│   ├── simple-signup/
│   │   ├── simple-signup.ts
│   │   ├── simple-signup.spec.ts
│   │   └── README.md   # Docs
│   ├── book-review/
│   │   └── ...
│   └── avatar-upload/
│       └── ...
├── lib/
│   ├── ui/             # Shared UI components
│   │   ├── button.ts
│   │   ├── form-field.ts
│   │   └── example-card.ts
│   └── field-errors.ts # Error message extraction helper
└── mocks/              # MSW mocks (for testing & development)
```
