import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'simple-signup',
    loadComponent: () =>
      import('./examples/simple-signup/simple-signup').then((m) => m.SimpleSignup),
  },
  {
    path: 'book-review',
    loadComponent: () => import('./examples/book-review/book-review').then((m) => m.BookReview),
  },
  {
    path: 'profile-edit',
    loadComponent: () => import('./examples/profile-edit/profile-edit').then((m) => m.ProfileEdit),
  },
  {
    path: 'pizza-order',
    loadComponent: () => import('./examples/pizza-order/pizza-order').then((m) => m.PizzaOrder),
  },
  {
    path: 'event-registration',
    loadComponent: () =>
      import('./examples/event-registration/event-registration').then((m) => m.EventRegistration),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./examples/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'location-select',
    loadComponent: () =>
      import('./examples/location-select/location-select').then((m) => m.LocationSelect),
  },
  {
    path: 'city-search',
    loadComponent: () => import('./examples/city-search/city-search').then((m) => m.CitySearch),
  },
  {
    path: 'avatar-upload',
    loadComponent: () =>
      import('./examples/avatar-upload/avatar-upload').then((m) => m.AvatarUpload),
  },
  {
    path: 'settings',
    loadComponent: () => import('./examples/settings/settings').then((m) => m.Settings),
  },
  {
    path: '',
    redirectTo: 'simple-signup',
    pathMatch: 'full',
  },
];
