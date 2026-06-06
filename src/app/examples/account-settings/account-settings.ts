import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  apply,
  form,
  FormField,
  maxLength,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { AppButton } from '../../lib/ui/button';
import { AppExamplePage } from '../../lib/ui/example-page';
import { AppFormField } from '../../lib/ui/form-field';
import { fieldErrors } from '../../lib/field-errors';
import readme from './README.md';

/** ユーザープロフィール（個人情報サブセクション） */
interface Profile {
  firstName: string;
  lastName: string;
}

/** ユーザー環境設定サブセクション */
interface Preferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

/** トップレベルのモデル: 2 つのサブセクションを持つネスト構造 */
interface UserData {
  profile: Profile;
  settings: Preferences;
}

/**
 * 初期値（編集前の現在のアカウント状態を模擬）。
 * セクション単位の reset() でこの値に復元する。
 */
const INITIAL_PROFILE: Profile = {
  firstName: 'Alice',
  lastName: 'Tanaka',
};
const INITIAL_PREFERENCES: Preferences = {
  theme: 'light',
  notifications: true,
};

/**
 * Profile サブセクション用の再利用可能なスキーマ。
 *
 * schema<T>(fn) で部分スキーマを切り出し、apply(path, schema) で
 * フォーム上のパスに後付けで適用できる。同じ Profile 構造を持つ別フォーム
 * （例: 共著者一覧の各要素）に再利用しても同じバリデーションが効く。
 */
const profileSchema = schema<Profile>((p) => {
  required(p.firstName, { message: 'First name is required' });
  maxLength(p.firstName, 50, { message: 'First name must be 50 characters or fewer' });
  required(p.lastName, { message: 'Last name is required' });
  maxLength(p.lastName, 50, { message: 'Last name must be 50 characters or fewer' });
});

/**
 * Account Settings Example
 *
 * Signal Forms におけるネストオブジェクトモデルの基本パターンを学ぶサンプル。
 * モデルが `{ profile: {...}, settings: {...} }` のネスト構造を持つとき、
 * フォームツリーは `userForm.profile.firstName` のようにパスで直接到達でき、
 * 同時に `userForm.profile().valid()` / `dirty()` のように親フィールドが
 * 子の状態を自動集約する。
 *
 * ## 学習ポイント
 * - ネストパス到達: モデル形状と `FieldTree` の階層が 1:1 で対応
 * - グループ valid() の集約: 根の `userForm().valid()` がツリー全体の妥当性を
 *   roll-up し、Save ボタンの活性化制御に直結する
 * - グループ dirty() の集約: セクション単位で変更検知し、Unsaved 表示と
 *   Reset section ボタンの活性化に反映
 * - セクション reset(): 片方のサブツリーだけ初期化、もう片方は維持
 * - schema() + apply(): 部分スキーマを切り出して特定パスに適用
 */
@Component({
  selector: 'app-account-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExamplePage],
  template: `
    <app-example-page [readme]="readme" sourcePath="examples/account-settings/account-settings.ts">
      <form novalidate (submit)="onSubmit($event)">
        <fieldset class="section">
          <legend class="section-title">Profile</legend>
          <div class="section-header">
            <div class="section-status">
              @if (userForm.profile().dirty()) {
                <span class="badge badge-dirty" role="status">Unsaved</span>
              }
            </div>
            <button
              type="button"
              class="section-reset"
              [disabled]="!userForm.profile().dirty()"
              (click)="onResetProfile()"
            >
              Reset section
            </button>
          </div>

          <app-form-field class="mb-3" label="First name" [errorMessages]="firstNameErrors()">
            <input
              type="text"
              [formField]="userForm.profile.firstName"
              class="form-input aria-invalid:border-red-500"
              [aria-invalid]="
                userForm.profile.firstName().touched() && userForm.profile.firstName().invalid()
              "
            />
          </app-form-field>

          <app-form-field label="Last name" [errorMessages]="lastNameErrors()">
            <input
              type="text"
              [formField]="userForm.profile.lastName"
              class="form-input aria-invalid:border-red-500"
              [aria-invalid]="
                userForm.profile.lastName().touched() && userForm.profile.lastName().invalid()
              "
            />
          </app-form-field>
        </fieldset>

        <fieldset class="section">
          <legend class="section-title">Preferences</legend>
          <div class="section-header">
            <div class="section-status">
              @if (userForm.settings().dirty()) {
                <span class="badge badge-dirty" role="status">Unsaved</span>
              }
            </div>
            <button
              type="button"
              class="section-reset"
              [disabled]="!userForm.settings().dirty()"
              (click)="onResetSettings()"
            >
              Reset section
            </button>
          </div>

          <app-form-field class="mb-3" label="Theme">
            <select [formField]="userForm.settings.theme" class="form-input">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </app-form-field>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [formField]="userForm.settings.notifications"
              class="form-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700">Email notifications</span>
          </label>
        </fieldset>

        <app-button type="submit" [disabled]="!userForm().dirty() || !userForm().valid()">
          Save all changes
        </app-button>
      </form>

      @if (submitted()) {
        <div class="form-success" role="status">Account updated!</div>
      }
    </app-example-page>
  `,
  styles: `
    .section {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1f2937;
      padding: 0 0.5rem;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .section-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      min-height: 1.5rem;
    }
    .badge-dirty {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: #fef3c7;
      color: #92400e;
    }
    .section-reset {
      font-size: 0.8rem;
      color: #374151;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.25rem 0.625rem;
    }
    .section-reset:hover:not(:disabled) {
      background: #f9fafb;
    }
    .section-reset:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    .section-reset:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class AccountSettings {
  protected readonly readme = readme;
  readonly submitted = signal(false);

  /**
   * フォームモデル
   *
   * ネストオブジェクトをそのまま signal で持つ。`form()` はこのモデルの
   * 型から `FieldTree` の階層を自動で導出する。
   */
  readonly userModel = signal<UserData>({
    profile: { ...INITIAL_PROFILE },
    settings: { ...INITIAL_PREFERENCES },
  });

  /**
   * フォーム定義
   *
   * apply(s.profile, profileSchema) で「特定パスに既製スキーマを適用」する。
   * これにより profile サブツリーに対するバリデーションは外部の
   * profileSchema 側で完結し、別フォームで同じ構造を扱うときも再利用できる。
   * settings サブツリーは型レベルで有効値が決まるため追加のバリデータは不要。
   */
  readonly userForm = form(this.userModel, (s) => {
    apply(s.profile, profileSchema);
  });

  /** エラーメッセージ。ネストパス越しに FieldState を取得する点に注意 */
  readonly firstNameErrors = computed(() => fieldErrors(this.userForm.profile.firstName()));
  readonly lastNameErrors = computed(() => fieldErrors(this.userForm.profile.lastName()));

  /**
   * フォーム送信処理
   *
   * submit() はバリデーション通過時のみコールバックを実行する。
   * 失敗時は最初の invalid フィールドにフォーカスを移す。
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.userForm, async () => {
      this.submitted.set(true);
    });

    const fields = [this.userForm.profile.firstName, this.userForm.profile.lastName];
    const firstInvalid = fields.find((f) => f().invalid());
    firstInvalid?.().focusBoundControl();
  }

  /**
   * Profile セクションだけを初期値に戻す。
   *
   * FieldTree はパスごとに `.reset(value)` を持ち、その部分木の値と
   * 状態（touched/dirty）だけをまとめてリセットする。他セクションの
   * 編集はそのまま保持される（ここがネスト構造を扱う最大の利点）。
   */
  onResetProfile() {
    this.userForm.profile().reset({ ...INITIAL_PROFILE });
    this.submitted.set(false);
  }

  /**
   * Preferences セクションだけを初期値に戻す。
   */
  onResetSettings() {
    this.userForm.settings().reset({ ...INITIAL_PREFERENCES });
    this.submitted.set(false);
  }
}
