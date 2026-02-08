import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'simple-signup',
    loadComponent: () => import('./examples/simple-signup').then((m) => m.SimpleSignup),
  },
  {
    path: 'book-review',
    loadComponent: () => import('./examples/book-review').then((m) => m.BookReview),
  },
  {
    path: 'profile-edit',
    loadComponent: () => import('./examples/profile-edit').then((m) => m.ProfileEdit),
  },
  {
    path: 'pizza-order',
    loadComponent: () => import('./examples/pizza-order').then((m) => m.PizzaOrder),
  },
  {
    path: 'event-registration',
    loadComponent: () => import('./examples/event-registration').then((m) => m.EventRegistration),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./examples/checkout').then((m) => m.Checkout),
  },
  {
    path: 'location-select',
    loadComponent: () => import('./examples/location-select').then((m) => m.LocationSelect),
  },
  {
    path: 'city-search',
    loadComponent: () => import('./examples/city-search').then((m) => m.CitySearch),
  },
  {
    path: 'settings',
    loadComponent: () => import('./examples/settings').then((m) => m.Settings),
  },
  {
    path: '',
    redirectTo: 'simple-signup',
    pathMatch: 'full',
  },
];
