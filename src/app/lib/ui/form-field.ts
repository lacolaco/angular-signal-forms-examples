import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * AppFormField
 *
 * フォームフィールドのUIラッパーコンポーネント。
 * Signal Forms API に依存しない純粋なプレゼンテーションコンポーネント。
 *
 * ## 責務
 * - ラベルの表示
 * - 入力要素のスロット（ng-content）
 * - エラーメッセージの表示
 *
 * ## 使い方
 * ```html
 * <app-form-field label="Email" [errorMessages]="errors">
 *   <input type="email" [formField]="form.email" class="form-input" />
 * </app-form-field>
 * ```
 */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
    <label class="block">
      <span class="block text-sm font-medium text-gray-700 mb-1">{{ label() }}</span>
      <ng-content />
    </label>
    @if (errorMessages().length > 0) {
      <ul class="mt-1 text-sm text-red-600">
        @for (message of errorMessages(); track message) {
          <li>{{ message }}</li>
        }
      </ul>
    }
  `,
})
export class AppFormField {
  /** ラベルテキスト */
  readonly label = input.required<string>();
  /** 表示するエラーメッセージの配列 */
  readonly errorMessages = input<string[]>([]);
}
