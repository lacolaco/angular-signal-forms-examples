import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  form,
  FormField,
  required,
  maxLength,
  minLength,
  pattern,
  validateHttp,
  submit,
} from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppSourceLink } from '../lib/ui/source-link';
import { fieldErrors } from '../lib/field-errors';

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
}

/**
 * Profile Edit Example
 *
 * Signal Forms の非同期バリデーション（validateHttp）の実装例。
 * username の重複チェックをバックエンドAPIに問い合わせる。
 *
 * ## 学習ポイント
 * - validateHttp() による HTTP ベースの非同期バリデーション
 * - pending() 状態の表示
 * - 同期バリデーションと非同期バリデーションの組み合わせ
 * - pattern() による正規表現バリデーション
 */
@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppSourceLink],
  template: `
    <div class="page-container">
      <div class="form-card">
        <h1 class="form-heading">Profile Edit</h1>
        <p class="form-topic">Async Validation</p>
        <p class="text-gray-600 mb-4">Update your profile information</p>
        <p class="text-xs text-gray-500 mb-6">
          Demo: Usernames <code class="bg-gray-100 px-1 rounded">admin</code>,
          <code class="bg-gray-100 px-1 rounded">user</code>,
          <code class="bg-gray-100 px-1 rounded">test</code>,
          <code class="bg-gray-100 px-1 rounded">john</code>,
          <code class="bg-gray-100 px-1 rounded">jane</code> are already taken.
        </p>

        <form novalidate (submit)="onSubmit($event)">
          <!-- Username -->
          <app-form-field class="mb-4" label="Username" [errorMessages]="usernameErrors()">
            <div class="relative">
              <input
                type="text"
                [formField]="profileForm.username"
                class="form-input"
                [class.invalid]="
                  profileForm.username().touched() && profileForm.username().invalid()
                "
                placeholder="e.g., john_doe123"
              />
              @if (profileForm.username().pending()) {
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
                  aria-live="polite"
                >
                  Checking...
                </span>
              }
            </div>
            @if (usernameAvailable()) {
              <p class="mt-1 text-sm text-green-600">
                {{ profileForm.username().value() }} is available
              </p>
            }
          </app-form-field>

          <!-- Display Name -->
          <app-form-field class="mb-4" label="Display Name" [errorMessages]="displayNameErrors()">
            <input
              type="text"
              [formField]="profileForm.displayName"
              class="form-input"
              [class.invalid]="
                profileForm.displayName().touched() && profileForm.displayName().invalid()
              "
              placeholder="e.g., John Doe"
            />
          </app-form-field>

          <!-- Bio -->
          <app-form-field class="mb-6" label="Bio" [errorMessages]="bioErrors()">
            <textarea
              [formField]="profileForm.bio"
              rows="4"
              class="form-textarea"
              [class.invalid]="profileForm.bio().touched() && profileForm.bio().invalid()"
              placeholder="Tell us about yourself..."
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">{{ profileForm.bio().value().length }} / 200</p>
          </app-form-field>

          <app-button type="submit" [loading]="profileForm().pending()"> Save Profile </app-button>
        </form>

        @if (submittedValue(); as submitted) {
          <div class="form-success">Profile saved! Welcome, {{ submitted.displayName }}!</div>
        }

        <app-source-link class="mt-6" path="examples/profile-edit.ts" />
      </div>
    </div>
  `,
})
export class ProfileEdit {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<ProfileData | null>(null);

  /** フォームモデル */
  readonly profileModel = signal<ProfileData>({
    username: '',
    displayName: '',
    bio: '',
  });

  /**
   * フォーム定義（同期・非同期バリデーション）
   *
   * - username: 必須、3-20文字、英数字+アンダースコア、非同期で重複チェック
   * - displayName: 必須、1-50文字
   * - bio: 任意、最大200文字
   */
  readonly profileForm = form(this.profileModel, (schema) => {
    // ユーザー名バリデーション
    required(schema.username, { message: 'Username is required' });
    minLength(schema.username, 3, { message: 'Username must be at least 3 characters' });
    maxLength(schema.username, 20, { message: 'Username must be at most 20 characters' });
    pattern(schema.username, /^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain alphanumeric characters and underscores',
    });

    // ユーザー名の重複チェック（非同期バリデーション）
    // validateHttp は同期バリデーションがすべてパスした後にのみ実行される
    validateHttp(schema.username, {
      request: ({ value }) => {
        const params = new URLSearchParams({ username: value() });
        return `/api/check-username?${params}`;
      },
      onSuccess: (response: { taken: boolean }) => {
        if (response.taken) {
          return { kind: 'usernameTaken', message: 'This username is already taken' };
        }
        return null;
      },
      onError: () => ({
        kind: 'networkError',
        message: 'Could not verify username availability',
      }),
    });

    // 表示名バリデーション
    required(schema.displayName, { message: 'Display name is required' });
    maxLength(schema.displayName, 50, { message: 'Display name must be at most 50 characters' });

    // 自己紹介バリデーション（任意）
    maxLength(schema.bio, 200, { message: 'Bio must be at most 200 characters' });
  });

  readonly usernameErrors = computed(() => fieldErrors(this.profileForm.username()));
  readonly usernameAvailable = computed(() => {
    const state = this.profileForm.username();
    return !state.pending() && state.valid();
  });
  readonly displayNameErrors = computed(() => fieldErrors(this.profileForm.displayName()));
  readonly bioErrors = computed(() => fieldErrors(this.profileForm.bio()));

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.profileForm, async () => {
      this.submittedValue.set({ ...this.profileModel() });
    });

    // invalid なフィールドにフォーカス
    if (this.profileForm.username().invalid()) {
      this.profileForm.username().focusBoundControl();
    } else if (this.profileForm.displayName().invalid()) {
      this.profileForm.displayName().focusBoundControl();
    } else if (this.profileForm.bio().invalid()) {
      this.profileForm.bio().focusBoundControl();
    }
  }
}
