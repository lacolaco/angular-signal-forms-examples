import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';

interface SettingsData {
  language: string;
  emailNotifications: boolean;
  pageSize: string;
}

/** デフォルト設定値 */
const DEFAULT_SETTINGS: SettingsData = {
  language: 'ja',
  emailNotifications: true,
  pageSize: '25',
};

/**
 * Settings Example
 *
 * Signal Forms の reset() メソッドによるフォームリセット/初期値復元の実装例。
 *
 * ## 学習ポイント
 * - FieldState.reset(value) による値と状態（touched/dirty）の同時リセット
 * - dirty() シグナルによるフィールド単位の変更検知
 * - 変更されたフィールドの視覚的区別
 */
@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExampleCard],
  template: `
    <app-example-card
      title="Settings"
      topic="Form Reset"
      description="フォームのリセットと初期値の復元"
      sourcePath="examples/settings.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <div
          class="mb-4 transition-all duration-200"
          data-field="language"
          [class.field-modified]="settingsForm.language().dirty()"
        >
          <app-form-field label="Language">
            <select [formField]="settingsForm.language" class="form-input">
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </app-form-field>
        </div>

        <div
          class="mb-4 transition-all duration-200"
          data-field="emailNotifications"
          [class.field-modified]="settingsForm.emailNotifications().dirty()"
        >
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [formField]="settingsForm.emailNotifications"
              class="form-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">Email Notifications</span>
          </label>
        </div>

        <div
          class="mb-6 transition-all duration-200"
          data-field="pageSize"
          [class.field-modified]="settingsForm.pageSize().dirty()"
        >
          <app-form-field label="Page Size">
            <select [formField]="settingsForm.pageSize" class="form-input">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </app-form-field>
        </div>

        @if (settingsForm().dirty()) {
          <p class="mb-4 text-sm text-amber-600" role="status">Unsaved changes</p>
        }

        <div class="flex gap-3">
          <app-button type="submit" class="flex-1"> Save </app-button>
          <button
            type="button"
            class="flex-1 py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!settingsForm().dirty()"
            (click)="onReset()"
          >
            Reset to Default
          </button>
        </div>
      </form>

      @if (submitted()) {
        <div class="form-success">Settings saved!</div>
      }
    </app-example-card>
  `,
  styles: `
    .field-modified {
      border-left: 4px solid #f59e0b;
      background-color: #fffbeb;
      padding-left: 0.75rem;
      border-radius: 0.25rem;
    }
  `,
})
export class Settings {
  readonly submitted = signal(false);

  /** フォームモデル */
  readonly settingsModel = signal<SettingsData>({ ...DEFAULT_SETTINGS });

  /**
   * フォーム定義
   *
   * 設定フォームのため、バリデーションは最小限。
   */
  readonly settingsForm = form(this.settingsModel, (schema) => {
    required(schema.language, { message: 'Language is required' });
  });

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.settingsForm, async () => {
      this.submitted.set(true);
    });
  }

  /**
   * フォームリセット処理
   *
   * reset(value) で値と状態（touched/dirty）を同時にリセットする。
   */
  onReset() {
    this.settingsForm().reset({ ...DEFAULT_SETTINGS });
    this.submitted.set(false);
  }
}
