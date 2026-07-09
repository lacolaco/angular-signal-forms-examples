import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'simple-signup',
    loadComponent: () =>
      import('./examples/simple-signup/simple-signup').then((m) => m.SimpleSignup),
  },
  {
    path: 'account-settings',
    loadComponent: () =>
      import('./examples/account-settings/account-settings').then((m) => m.AccountSettings),
  },
  {
    path: 'event-registration',
    loadComponent: () =>
      import('./examples/event-registration/event-registration').then((m) => m.EventRegistration),
  },
  {
    path: 'settings',
    loadComponent: () => import('./examples/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'pizza-order',
    loadComponent: () => import('./examples/pizza-order/pizza-order').then((m) => m.PizzaOrder),
  },
  {
    path: 'location-select',
    loadComponent: () =>
      import('./examples/location-select/location-select').then((m) => m.LocationSelect),
  },
  {
    path: 'hotel-search',
    loadComponent: () => import('./examples/hotel-search/hotel-search').then((m) => m.HotelSearch),
  },
  {
    path: 'profile-edit',
    loadComponent: () => import('./examples/profile-edit/profile-edit').then((m) => m.ProfileEdit),
  },
  {
    path: 'book-review',
    loadComponent: () => import('./examples/book-review/book-review').then((m) => m.BookReview),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./examples/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'avatar-upload',
    loadComponent: () =>
      import('./examples/avatar-upload/avatar-upload').then((m) => m.AvatarUpload),
  },
  {
    path: 'city-search',
    loadComponent: () => import('./examples/city-search/city-search').then((m) => m.CitySearch),
  },
  {
    path: 'comment-post',
    loadComponent: () => import('./examples/comment-post/comment-post').then((m) => m.CommentPost),
  },
  {
    path: '',
    redirectTo: 'simple-signup',
    pathMatch: 'full',
  },
];
