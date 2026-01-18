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
      [disabled]="disabled()"
      class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ng-content />
    </button>
  `,
})
export class AppButton {
  /** ボタンのtype属性 */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** ボタンの無効状態 */
  readonly disabled = input<boolean>(false);
}
