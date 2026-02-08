import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  linkedSignal,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, FormValueControl, required, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppExampleCard } from '../lib/ui/example-card';
import { fieldErrors } from '../lib/field-errors';

interface CheckoutData {
  cardNumber: string;
  expiryDate: string; // "MM/YY" 形式
  securityCode: string;
  cardholderName: string;
}

/**
 * "MM/YY" 形式の文字列から月を抽出
 */
function parseMonth(expiryDate: string): string {
  return expiryDate.includes('/') ? expiryDate.split('/')[0] : '';
}

/**
 * "MM/YY" 形式の文字列から年を抽出
 */
function parseYear(expiryDate: string): string {
  return expiryDate.includes('/') ? expiryDate.split('/')[1] : '';
}

/**
 * 月と年から "MM/YY" 形式の文字列を生成
 */
function formatExpiryDate(month: string, year: string): string {
  return `${month}/${year}`;
}

/**
 * ExpiryDateInput Component
 *
 * Signal Forms のカスタムフォームコントロール実装例。
 * 月と年を別々の入力フィールドで受け取り、"MM/YY" 形式の文字列に変換する。
 *
 * ## 学習ポイント
 *
 * ### FormValueControl インターフェース
 * - `model()` シグナルを `value` プロパティとして公開するだけで実装完了
 * - [formField] ディレクティブが自動的にバインディングを行う
 *
 * ### UI とモデルの分離
 * - UI: 月(MM)と年(YY)の2つの入力フィールド
 * - モデル: "MM/YY" 形式の単一文字列
 * - linkedSignal() で外部からの値変更を内部状態に同期（effect不要）
 *
 * ### カスタムコントロールのフォーカス制御
 * - focus() メソッドを実装すると focusBoundControl() から呼び出される
 * - viewChild() でテンプレート参照を取得し、フォーカス先を指定
 * - 複数入力がある場合、どの要素にフォーカスするか制御可能
 */
@Component({
  selector: 'app-expiry-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center gap-1',
  },
  template: `
    <!--
      #monthInput: テンプレート参照変数
      viewChild('monthInput') でコンポーネントから参照を取得し、
      focus() メソッドでこの要素にフォーカスを移動する
    -->
    <input
      #monthInput
      type="text"
      maxlength="2"
      inputmode="numeric"
      placeholder="MM"
      class="w-12 text-center form-input"
      [value]="month()"
      (input)="onMonthInput($event)"
    />
    <span class="text-gray-500">/</span>
    <input
      type="text"
      maxlength="2"
      inputmode="numeric"
      placeholder="YY"
      class="w-12 text-center form-input"
      [value]="year()"
      (input)="onYearInput($event)"
    />
  `,
})
export class ExpiryDateInput implements FormValueControl<string> {
  /** フォームにバインドされる値（"MM/YY" 形式） */
  readonly value = model('');

  /**
   * 月入力フィールドへの参照
   *
   * viewChild.required() でテンプレート参照変数 #monthInput を取得。
   * テンプレートに必ず存在するため required を使用し、non-nullable にする。
   * focus() メソッドでこの要素にフォーカスを移動するために使用。
   */
  private readonly monthInput = viewChild.required<ElementRef<HTMLInputElement>>('monthInput');

  /**
   * 内部状態: 月（MM）
   *
   * linkedSignal() を使用し、value の変更に連動して初期化される。
   * ユーザー入力時は set() で直接更新可能。
   * effect() を使わずに双方向の同期を実現。
   */
  protected readonly month = linkedSignal(() => parseMonth(this.value()));

  /**
   * 内部状態: 年（YY）
   *
   * linkedSignal() を使用し、value の変更に連動して初期化される。
   * ユーザー入力時は set() で直接更新可能。
   */
  protected readonly year = linkedSignal(() => parseYear(this.value()));

  /**
   * 月入力時のハンドラ
   */
  protected onMonthInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newMonth = input.value.replace(/\D/g, '').slice(0, 2);
    this.month.set(newMonth);
    this.updateValue();
  }

  /**
   * 年入力時のハンドラ
   */
  protected onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newYear = input.value.replace(/\D/g, '').slice(0, 2);
    this.year.set(newYear);
    this.updateValue();
  }

  /**
   * month/year → "MM/YY" に変換して value に反映
   */
  private updateValue(): void {
    this.value.set(formatExpiryDate(this.month(), this.year()));
  }

  /**
   * カスタムコントロールのフォーカスメソッド
   *
   * Signal Forms の focusBoundControl() は、カスタムコントロールに
   * focus() メソッドが定義されていれば自動的にそれを呼び出す。
   * これにより、複数の内部入力要素がある場合でも、
   * どの要素にフォーカスするかを制御できる。
   *
   * このコンポーネントでは月入力(MM)にフォーカスを移動する。
   */
  focus(): void {
    this.monthInput().nativeElement.focus();
  }
}

/**
 * Checkout Example
 *
 * Signal Forms の Custom Control を活用したカード決済フォームのサンプル実装。
 * 有効期限は UI 上で月と年を分けて入力するが、フォームモデル上は "MM/YY" の単一フィールドとして管理。
 *
 * ## 学習ポイント
 *
 * ### カスタムコントロールの統合
 * - [formField] ディレクティブでカスタムコントロールをフォームにバインド
 * - 通常の input と同様に focusBoundControl() でフォーカス制御可能
 *
 * ### バリデーションエラー時のフォーカス制御
 * - focusBoundControl() はカスタムコントロールの focus() メソッドを呼び出す
 * - これにより、エラー時に適切な入力要素にフォーカスを移動できる
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppExampleCard, ExpiryDateInput],
  template: `
    <app-example-card
      title="Checkout"
      topic="Custom Control"
      description="カード情報を入力してください"
      sourcePath="examples/checkout.ts"
    >
      <form novalidate (submit)="onSubmit($event)">
        <!-- カード番号 -->
        <app-form-field class="mb-4" label="Card Number" [errorMessages]="cardNumberErrors()">
          <input
            type="text"
            inputmode="numeric"
            [formField]="checkoutForm.cardNumber"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="
              checkoutForm.cardNumber().touched() && checkoutForm.cardNumber().invalid()
            "
            placeholder="1234 5678 9012 3456"
          />
        </app-form-field>

        <!--
          有効期限: カスタムコントロールの使用例

          [formField] でカスタムコントロールをフォームにバインド。
          ExpiryDateInput は FormValueControl<string> を実装しているため、
          通常の input と同様に扱える。

          focusBoundControl() を呼び出すと、ExpiryDateInput.focus() が
          呼び出され、月入力(MM)にフォーカスが移動する。
        -->
        <div class="mb-4">
          <span class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</span>
          <app-expiry-date-input [formField]="checkoutForm.expiryDate" />
          @if (expiryDateErrors().length > 0) {
            <ul class="mt-1 text-sm text-red-600">
              @for (message of expiryDateErrors(); track message) {
                <li>{{ message }}</li>
              }
            </ul>
          }
        </div>

        <!-- セキュリティコード -->
        <app-form-field class="mb-4" label="Security Code" [errorMessages]="securityCodeErrors()">
          <input
            type="text"
            inputmode="numeric"
            [formField]="checkoutForm.securityCode"
            class="form-input w-20 aria-invalid:border-red-500"
            [aria-invalid]="
              checkoutForm.securityCode().touched() && checkoutForm.securityCode().invalid()
            "
            placeholder="123"
          />
        </app-form-field>

        <!-- カード名義 -->
        <app-form-field
          class="mb-6"
          label="Cardholder Name"
          [errorMessages]="cardholderNameErrors()"
        >
          <input
            type="text"
            [formField]="checkoutForm.cardholderName"
            class="form-input aria-invalid:border-red-500"
            [aria-invalid]="
              checkoutForm.cardholderName().touched() && checkoutForm.cardholderName().invalid()
            "
            placeholder="TARO YAMADA"
          />
        </app-form-field>

        <app-button type="submit">Pay</app-button>
      </form>

      @if (submittedValue(); as submitted) {
        <div class="form-success">Payment complete! (Expiry: {{ submitted.expiryDate }})</div>
      }
    </app-example-card>
  `,
})
export class Checkout {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<CheckoutData | null>(null);

  /** フォームモデル */
  readonly checkoutModel = signal<CheckoutData>({
    cardNumber: '',
    expiryDate: '',
    securityCode: '',
    cardholderName: '',
  });

  /**
   * フォーム定義
   *
   * 全フィールド required
   */
  readonly checkoutForm = form(this.checkoutModel, (schema) => {
    required(schema.cardNumber, { message: 'Card number is required' });
    required(schema.expiryDate, { message: 'Expiry date is required' });
    required(schema.securityCode, { message: 'Security code is required' });
    required(schema.cardholderName, { message: 'Cardholder name is required' });
  });

  readonly cardNumberErrors = computed(() => fieldErrors(this.checkoutForm.cardNumber()));
  readonly expiryDateErrors = computed(() => fieldErrors(this.checkoutForm.expiryDate()));
  readonly securityCodeErrors = computed(() => fieldErrors(this.checkoutForm.securityCode()));
  readonly cardholderNameErrors = computed(() => fieldErrors(this.checkoutForm.cardholderName()));

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.checkoutForm, async () => {
      this.submittedValue.set({ ...this.checkoutModel() });
    });

    // invalid なフィールドにフォーカス
    if (this.checkoutForm.cardNumber().invalid()) {
      this.checkoutForm.cardNumber().focusBoundControl();
    } else if (this.checkoutForm.expiryDate().invalid()) {
      this.checkoutForm.expiryDate().focusBoundControl();
    } else if (this.checkoutForm.securityCode().invalid()) {
      this.checkoutForm.securityCode().focusBoundControl();
    } else if (this.checkoutForm.cardholderName().invalid()) {
      this.checkoutForm.cardholderName().focusBoundControl();
    }
  }
}
