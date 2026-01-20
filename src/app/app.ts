import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * ナビゲーション項目の定義
 * 新しいユースケースを追加する際はここに追加する
 */
const navItems = [
  { path: '/simple-signup', label: 'Simple Signup', topic: 'Basic Form' },
  { path: '/book-review', label: 'Book Review', topic: 'Custom Control' },
  { path: '/profile-edit', label: 'Profile Edit', topic: 'Async Validation' },
  { path: '/pizza-order', label: 'Pizza Order', topic: 'Conditional Form' },
  { path: '/event-registration', label: 'Event Registration', topic: 'Array Form' },
  { path: '/checkout', label: 'Checkout', topic: 'Custom Control' },
] as const;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen">
      <!-- サイドナビゲーション -->
      <nav class="w-64 bg-gray-800 text-white p-4 shrink-0">
        <h1 class="text-xl font-bold mb-6">Signal Forms Examples</h1>
        <ul class="space-y-2">
          @for (item of navItems; track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-gray-700"
                class="block px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span class="block font-medium">{{ item.label }}</span>
                <span class="block text-xs text-gray-400">{{ item.topic }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- メインコンテンツ -->
      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  readonly navItems = navItems;
}
