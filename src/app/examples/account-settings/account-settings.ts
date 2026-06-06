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
 * 未送信時の Reset section はここに戻る（送信後は submittedValue が baseline）。
 */
const INITIAL_USER: UserData = {
  profile: { firstName: 'Alice', lastName: 'Tanaka' },
  settings: { theme: 'light', notifications: true },
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
        <fieldset class="mb-6">
          @let profile = userForm.profile;
          <legend class="font-semibold mb-3">Profile</legend>

          <app-form-field class="mb-3" label="First name" [errorMessages]="firstNameErrors()">
            <input
              type="text"
              [formField]="profile.firstName"
              class="form-input aria-invalid:border-red-500"
              [aria-invalid]="profile.firstName().touched() && profile.firstName().invalid()"
            />
          </app-form-field>

          <app-form-field label="Last name" [errorMessages]="lastNameErrors()">
            <input
              type="text"
              [formField]="profile.lastName"
              class="form-input aria-invalid:border-red-500"
              [aria-invalid]="profile.lastName().touched() && profile.lastName().invalid()"
            />
          </app-form-field>
        </fieldset>

        <fieldset class="mb-6">
          @let settings = userForm.settings;
          <legend class="font-semibold mb-3">Preferences</legend>

          <app-form-field class="mb-3" label="Theme">
            <select [formField]="settings.theme" class="form-input">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </app-form-field>

          <label class="flex items-center gap-2">
            <input type="checkbox" [formField]="settings.notifications" />
            <span>Email notifications</span>
          </label>
        </fieldset>

        <app-button type="submit">Save all changes</app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success" role="status">
          Account updated!
          <ul class="mt-2 text-sm list-disc list-inside">
            <li>First name: {{ submitted.profile.firstName }}</li>
            <li>Last name: {{ submitted.profile.lastName }}</li>
            <li>Theme: {{ submitted.settings.theme }}</li>
            <li>Email notifications: {{ submitted.settings.notifications ? 'on' : 'off' }}</li>
          </ul>
        </div>
      }
    </app-example-page>
  `,
})
export class AccountSettings {
  protected readonly readme = readme;
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<UserData | null>(null);

  /**
   * フォームモデル
   *
   * ネストオブジェクトをそのまま signal で持つ。`form()` はこのモデルの
   * 型から `FieldTree` の階層を自動で導出する。
   */
  readonly userModel = signal<UserData>({ ...INITIAL_USER });

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
      this.submittedValue.set({ ...this.userModel() });
    });

    const fields = [this.userForm.profile.firstName, this.userForm.profile.lastName];
    const firstInvalid = fields.find((f) => f().invalid());
    firstInvalid?.().focusBoundControl();
  }
}
