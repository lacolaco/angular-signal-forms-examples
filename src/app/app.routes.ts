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
    path: '',
    redirectTo: 'simple-signup',
    pathMatch: 'full',
  },
];
