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
| 2 | Book Review | Custom Control | Star rating control with `FormValueControl<number>` | [Docs](src/app/examples/book-review/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/book-review) |
| 3 | Profile Edit | Async Validation | Username duplicate check with `validateHttp()`, `pending()` state | [Docs](src/app/examples/profile-edit/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/profile-edit) |
| 4 | Pizza Order | Conditional Form | Dynamic fields based on delivery method with `applyWhen()`, `hidden()` | [Docs](src/app/examples/pizza-order/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/pizza-order) |
| 5 | Event Registration | Array Form | Dynamic attendee list with `applyEach()` | [Docs](src/app/examples/event-registration/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/event-registration) |
| 6 | Checkout | Custom Control | Expiration date input with `FormValueControl<string>` + `linkedSignal()` | [Docs](src/app/examples/checkout/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/checkout) |
| 7 | Location Select | Cascade Select | Cascading region/country/city selects with `computed()` | [Docs](src/app/examples/location-select/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/location-select) |
| 8 | City Search | Autocomplete | Accessible autocomplete with `@angular/aria` Combobox + `httpResource()` | [Docs](src/app/examples/city-search/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/city-search) |
| 9 | Avatar Upload | Custom Control | Image preview with `FormValueControl<File \| null>` + `resource()` | [Docs](src/app/examples/avatar-upload/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/avatar-upload) |
| 10 | Settings | Form Reset | Initial value restoration with `reset()`, change detection with `dirty()` | [Docs](src/app/examples/settings/README.md) | [Demo](https://lacolaco.github.io/angular-signal-forms-examples/settings) |

### Recommended Learning Order

1. **Getting Started**: Understand Signal Forms basics with Simple Signup
2. **Validation**: Profile Edit (async), Pizza Order (conditional), Event Registration (array)
3. **Custom Controls**: Book Review → Checkout → Avatar Upload (progressive complexity)
4. **External Data**: Location Select, City Search

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
| `reset()` | Reset form values and state | Settings |
| `dirty()` | Change detection signal | Settings |
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
