import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { form, FormField, required, applyWhen, hidden, submit } from '@angular/forms/signals';
import { AppFormField } from '../lib/ui/form-field';
import { AppButton } from '../lib/ui/button';
import { AppSourceLink } from '../lib/ui/source-link';
import { fieldErrors } from '../lib/field-errors';

type OrderType = 'togo' | 'delivery';
type PaymentMethod = 'cash' | 'card';

interface OrderData {
  customerName: string;
  orderType: OrderType;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
}

/**
 * Pizza Order Example
 *
 * Signal Forms の条件分岐機能を活用した動的フォームのサンプル実装。
 * To go（店舗受取）vs Delivery（配達）で必須項目・表示項目が切り替わる。
 *
 * ## 学習ポイント
 * - applyWhen(): 条件付きスキーマ適用
 * - hidden(): 条件付きフィールド非表示
 * - validate() + valueOf(): 他フィールド参照によるカスタムバリデーション
 * - @if による動的 UI 表示
 */
@Component({
  selector: 'app-pizza-order',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, AppFormField, AppButton, AppSourceLink],
  template: `
    <div class="page-container">
      <div class="form-card">
        <h1 class="form-heading">Pizza Order</h1>
        <p class="form-topic">Conditional Form</p>
        <p class="form-description">注文内容を入力してください</p>

        <form novalidate (submit)="onSubmit($event)">
          <!-- Customer Name -->
          <app-form-field class="mb-4" label="Customer Name" [errorMessages]="customerNameErrors()">
            <input
              type="text"
              [formField]="orderForm.customerName"
              class="form-input"
              [class.invalid]="
                orderForm.customerName().touched() && orderForm.customerName().invalid()
              "
              placeholder="お名前"
            />
          </app-form-field>

          <!-- Order Type -->
          <app-form-field class="mb-4" label="Order Type">
            <select data-testid="orderType" [formField]="orderForm.orderType" class="form-select">
              <option value="togo">To go</option>
              <option value="delivery">Delivery</option>
            </select>
          </app-form-field>

          <!-- Delivery Address (conditional) -->
          @if (!orderForm.deliveryAddress().hidden()) {
            <app-form-field
              class="mb-4"
              label="Delivery Address"
              [errorMessages]="deliveryAddressErrors()"
            >
              <input
                type="text"
                [formField]="orderForm.deliveryAddress"
                class="form-input"
                [class.invalid]="
                  orderForm.deliveryAddress().touched() && orderForm.deliveryAddress().invalid()
                "
                placeholder="配達先住所"
              />
            </app-form-field>
          }

          <!-- Payment Method -->
          <app-form-field
            class="mb-6"
            label="Payment Method"
            [errorMessages]="paymentMethodErrors()"
          >
            <select
              data-testid="paymentMethod"
              [formField]="orderForm.paymentMethod"
              class="form-select"
              [class.invalid]="
                orderForm.paymentMethod().touched() && orderForm.paymentMethod().invalid()
              "
            >
              @if (orderModel().orderType === 'togo') {
                <option value="">選択してください</option>
                <option value="cash">Cash</option>
              }
              <option value="card">Card</option>
            </select>
          </app-form-field>

          <app-button type="submit"> Order </app-button>
        </form>

        @if (submittedValue(); as submitted) {
          <div class="form-success">
            Thank you for your order!
            <br />
            {{ submitted.customerName }} -
            {{ submitted.orderType === 'delivery' ? 'Delivery' : 'To go' }}
          </div>
        }

        <app-source-link class="mt-6" path="examples/pizza-order.ts" />
      </div>
    </div>
  `,
})
export class PizzaOrder {
  /** 送信時点の値（nullなら未送信） */
  readonly submittedValue = signal<OrderData | null>(null);

  /** フォームモデル */
  readonly orderModel = signal<OrderData>({
    customerName: '',
    orderType: 'togo',
    deliveryAddress: '',
    paymentMethod: '' as PaymentMethod,
  });

  /**
   * フォーム定義
   *
   * - 共通バリデーション: customerName, paymentMethod は必須
   * - 条件付きバリデーション:
   *   - Delivery 時のみ deliveryAddress が必須
   *   - To go 時は deliveryAddress を非表示
   *   - Delivery 時は cash オプションを非表示（テンプレートで制御）
   */
  readonly orderForm = form(this.orderModel, (schema) => {
    // 共通バリデーション
    required(schema.customerName, { message: 'Customer name is required' });
    required(schema.paymentMethod, { message: 'Payment method is required' });

    // Delivery 時のみ住所を必須にする
    applyWhen(
      schema.deliveryAddress,
      ({ valueOf }) => valueOf(schema.orderType) === 'delivery',
      (addressPath) => {
        required(addressPath, { message: '配達先住所を入力してください' });
      },
    );

    // To go 時は住所フィールドを非表示
    hidden(schema.deliveryAddress, ({ valueOf }) => valueOf(schema.orderType) === 'togo');
  });

  constructor() {
    // Delivery 時は paymentMethod を card に固定
    effect(() => {
      const model = this.orderModel();
      if (model.orderType === 'delivery' && model.paymentMethod !== 'card') {
        this.orderModel.update((m) => ({ ...m, paymentMethod: 'card' }));
      }
    });
  }

  readonly customerNameErrors = computed(() => fieldErrors(this.orderForm.customerName()));
  readonly deliveryAddressErrors = computed(() => fieldErrors(this.orderForm.deliveryAddress()));
  readonly paymentMethodErrors = computed(() => fieldErrors(this.orderForm.paymentMethod()));

  /**
   * フォーム送信処理
   */
  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.orderForm, async () => {
      this.submittedValue.set({ ...this.orderModel() });
    });

    // invalid なフィールドにフォーカス
    if (this.orderForm.customerName().invalid()) {
      this.orderForm.customerName().focusBoundControl();
    } else if (
      !this.orderForm.deliveryAddress().hidden() &&
      this.orderForm.deliveryAddress().invalid()
    ) {
      this.orderForm.deliveryAddress().focusBoundControl();
    } else if (this.orderForm.paymentMethod().invalid()) {
      this.orderForm.paymentMethod().focusBoundControl();
    }
  }
}
