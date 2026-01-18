import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * AppButton
 *
 * ボタンのUIコンポーネント。
 * Tailwind CSS でスタイリングされた汎用ボタン。
 *
 * ## 使い方
 * ```html
 * <app-button type="submit" [disabled]="form().invalid()">
 *   Submit
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      @if (loading()) {
        <svg
          class="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class AppButton {
  /** ボタンのtype属性 */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** ボタンの無効状態 */
  readonly disabled = input<boolean>(false);
  /** ローディング状態 */
  readonly loading = input<boolean>(false);
}
