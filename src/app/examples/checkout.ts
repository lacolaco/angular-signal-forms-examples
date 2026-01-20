import { ChangeDetectionStrategy, Component, computed, effect, model, signal } from '@angular/core';
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
 * ExpiryDateInput Component
 *
 * Signal Forms のカスタムフォームコントロール実装例。
 * 月と年を別々の入力フィールドで受け取り、"MM/YY" 形式の文字列に変換する。
 *
 * ## 学習ポイント
 * - FormValueControl インターフェースの実装
 * - model() によるフォームとの双方向バインディング
 * - UI と モデルの分離: 複数入力 → 単一値への変換
 */
@Component({
  selector: 'app-expiry-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center gap-1',
  },
  template: `
    <input
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

  /** 内部状態: 月（MM） */
  protected readonly month = signal('');

  /** 内部状態: 年（YY） */
  protected readonly year = signal('');

  constructor() {
    // value → month/year に分解
    effect(() => {
      const v = this.value();
      if (v.includes('/')) {
        const [m, y] = v.split('/');
        // 内部状態と異なる場合のみ更新（無限ループ防止）
        if (m !== this.month()) {
          this.month.set(m);
        }
        if (y !== this.year()) {
          this.year.set(y);
        }
      } else if (v === '') {
        this.month.set('');
        this.year.set('');
      }
    });
  }

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
    this.value.set(`${this.month()}/${this.year()}`);
  }
}

/**
 * Checkout Example
 *
 * Signal Forms の Custom Control を活用したカード決済フォームのサンプル実装。
 * 有効期限は UI 上で月と年を分けて入力するが、フォームモデル上は "MM/YY" の単一フィールドとして管理。
 *
 * ## 学習ポイント
 * - FormValueControl: カスタムコントロールインターフェースの実装
 * - model(): フォームとの双方向バインディング
 * - UI と モデルの分離: 複数入力 → 単一値への変換
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
            class="form-input"
            [class.invalid]="
              checkoutForm.cardNumber().touched() && checkoutForm.cardNumber().invalid()
            "
            placeholder="1234 5678 9012 3456"
          />
        </app-form-field>

        <!-- 有効期限 -->
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
            class="form-input w-20"
            [class.invalid]="
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
            class="form-input"
            [class.invalid]="
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
      const monthInput = document.querySelector('app-expiry-date-input input');
      if (monthInput instanceof HTMLElement) {
        monthInput.focus();
      }
    } else if (this.checkoutForm.securityCode().invalid()) {
      this.checkoutForm.securityCode().focusBoundControl();
    } else if (this.checkoutForm.cardholderName().invalid()) {
      this.checkoutForm.cardholderName().focusBoundControl();
    }
  }
}
