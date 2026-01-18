import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { form, FormField, required, email, validate, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppSourceLink } from '../lib/ui/source-link';
import { fieldErrors } from '../lib/field-errors';

/**
 * Simple Signup Example
 *
 * Signal Forms の基本的な使い方を示すサインアップフォームの例。
 *
 * ## 学習ポイント
 * - form() 関数によるフォーム作成
 * - FormField ディレクティブによる双方向バインディング
 * - 組み込みバリデータ (required, email)
 * - カスタムバリデータ (validate)
 * - submit() 関数によるフォーム送信
 * - focusBoundControl() によるフォーカス制御
 */
@Component({
  selector: 'app-simple-signup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppSourceLink],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 class="text-2xl font-bold text-gray-800 mb-1">Simple Signup</h1>
        <p class="text-sm text-blue-600 mb-6">Basic Form</p>

        <!--
          novalidate: ブラウザのネイティブバリデーションを無効化し、
          Signal Forms のバリデーションを使用する
        -->
        <form novalidate (submit)="onSubmit($event)">
          <app-form-field class="mb-4" id="email" label="Email" [errorMessages]="emailErrors()">
            <!--
              [formField]: Signal Forms の FormField ディレクティブ。
              input要素とフィールドツリーを双方向バインドする。
              signupForm.email はフィールドツリーへの参照（関数として呼び出すとFieldStateを取得）
            -->
            <input
              id="email"
              type="email"
              [formField]="signupForm.email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-500]="signupForm.email().touched() && signupForm.email().invalid()"
            />
          </app-form-field>

          <app-form-field
            class="mb-4"
            id="password"
            label="Password"
            [errorMessages]="passwordErrors()"
          >
            <input
              id="password"
              type="password"
              [formField]="signupForm.password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-500]="
                signupForm.password().touched() && signupForm.password().invalid()
              "
            />
          </app-form-field>

          <app-form-field
            class="mb-6"
            id="confirmPassword"
            label="Confirm Password"
            [errorMessages]="confirmPasswordErrors()"
          >
            <input
              id="confirmPassword"
              type="password"
              [formField]="signupForm.confirmPassword"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-500]="
                signupForm.confirmPassword().touched() && signupForm.confirmPassword().invalid()
              "
            />
          </app-form-field>

          <app-button type="submit"> Sign Up </app-button>
        </form>

        @if (submitted()) {
          <div class="mt-4 p-3 bg-green-100 text-green-700 rounded-md">Sign up successful!</div>
        }

        <app-source-link class="mt-6" path="examples/simple-signup.ts" />
      </div>
    </div>
  `,
})
export class SimpleSignup {
  readonly submitted = signal(false);

  /**
   * フォームモデル
   *
   * Signal Forms では、フォームの値を保持する WritableSignal を定義する。
   * このシグナルの型がフォームの型として推論される。
   */
  readonly signupModel = signal({
    email: '',
    password: '',
    confirmPassword: '',
  });

  /**
   * フォーム定義
   *
   * form() 関数でフォームを作成する。
   * 第1引数: フォームモデル（WritableSignal）
   * 第2引数: バリデーションスキーマを定義するコールバック関数
   *
   * スキーマ関数内で各フィールドにバリデーションルールを設定する。
   * バリデーションはシグナルベースで自動的にリアクティブに動作する。
   */
  readonly signupForm = form(this.signupModel, (schema) => {
    // 組み込みバリデータ: required, email
    // message オプションでカスタムエラーメッセージを指定
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Please enter a valid email' });
    required(schema.password, { message: 'Password is required' });
    required(schema.confirmPassword, { message: 'Please confirm your password' });

    // カスタムバリデータ: validate() 関数
    // value(): 現在のフィールドの値を取得
    // valueOf(path): 他のフィールドの値を取得（リアクティブに追跡される）
    validate(schema.confirmPassword, ({ value, valueOf }) => {
      if (value() !== valueOf(schema.password)) {
        // エラーオブジェクトを返す: { kind: string, message?: string }
        return { kind: 'passwordMismatch', message: 'Passwords do not match' };
      }
      // バリデーション成功時は undefined を返す
      return undefined;
    });
  });

  /**
   * エラーメッセージの computed
   *
   * fieldErrors() 関数と computed() を組み合わせて、
   * リアクティブにエラーメッセージを取得する。
   */
  readonly emailErrors = computed(() => fieldErrors(this.signupForm.email()));
  readonly passwordErrors = computed(() => fieldErrors(this.signupForm.password()));
  readonly confirmPasswordErrors = computed(() => fieldErrors(this.signupForm.confirmPassword()));

  /**
   * フォーム送信処理
   *
   * submit() 関数を使用してフォームを送信する。
   * - 自動的に全フィールドを touched 状態にする
   * - フォームが valid な場合のみコールバックが実行される
   * - 送信中は form().submitting() が true になる
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.signupForm, async () => {
      this.submitted.set(true);
    });

    // focusBoundControl(): フィールドにバインドされたUI要素にフォーカスを移動
    // invalid なフィールドがあれば、最初の invalid フィールドにフォーカス
    const fields = [
      this.signupForm.email,
      this.signupForm.password,
      this.signupForm.confirmPassword,
    ];
    const firstInvalidField = fields.find((field) => field().invalid());
    firstInvalidField?.().focusBoundControl();
  }
}
