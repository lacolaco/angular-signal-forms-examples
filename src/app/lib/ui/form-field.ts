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
 * <app-form-field id="email" label="Email" [errorMessages]="errors">
 *   <input id="email" type="email" [formField]="form.email" />
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
    <label [for]="id()" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label() }}
    </label>
    <ng-content />
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
  /** ラベルに関連付けるinput要素のID */
  readonly id = input.required<string>();
  /** ラベルテキスト */
  readonly label = input.required<string>();
  /** 表示するエラーメッセージの配列 */
  readonly errorMessages = input<string[]>([]);
}
