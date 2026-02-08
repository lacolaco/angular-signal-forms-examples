# Pizza Order

## 概要

注文方法（To go / Delivery）に応じてフォームの必須項目や表示項目が動的に切り替わる、条件付きフォームのサンプル。

## 学習ポイント

- `applyWhen()`: 条件に基づくバリデーションの動的適用
- `hidden()`: 条件に基づくフィールドの非表示制御
- `valueOf()`: スキーマ定義内での他フィールド値の参照
- `submit()` + `focusBoundControl()`: 送信処理とフォーカス制御

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `customerName` | `string` | 常に必須 |
| `orderType` | `'togo' \| 'delivery'` | なし（初期値 `'togo'`） |
| `deliveryAddress` | `string` | Delivery 時のみ必須、To go 時は非表示 |
| `paymentMethod` | `'cash' \| 'card'` | 常に必須。Delivery 時は `'card'` に固定 |

## 実装の要点

### フォーム定義

`form()` の第2引数でスキーマを定義する。`applyWhen()` で配達時のみ住所を必須にし、`hidden()` で To go 時に住所フィールドを非表示にする。

```typescript
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
```

`applyWhen()` の条件関数は `valueOf()` を通じて他フィールドの現在値を参照できる。`orderType` が変更されると、バリデーションと表示状態がリアクティブに再評価される。

### テンプレート

`hidden()` で設定した非表示状態は `field().hidden()` シグナルで読み取り、`@if` で表示を制御する。

```html
@if (!orderForm.deliveryAddress().hidden()) {
  <app-form-field label="Delivery Address" [errorMessages]="deliveryAddressErrors()">
    <input [formField]="orderForm.deliveryAddress" />
  </app-form-field>
}
```

Delivery 時は cash 支払いが不可のため、`@if` で `<option>` の表示を切り替えている。これは `[disabled]` が `[formField]` と併用できない Signal Forms の制約への対処法でもある。

```html
<select [formField]="orderForm.paymentMethod">
  @if (orderModel().orderType === 'togo') {
    <option value="">選択してください</option>
    <option value="cash">Cash</option>
  }
  <option value="card">Card</option>
</select>
```

### 送信処理

`submit()` でバリデーション済みの送信を行い、無効なフィールドがあれば `focusBoundControl()` でフォーカスを移動する。`hidden()` で非表示のフィールドはフォーカス対象から除外している。

```typescript
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
  }
}
```

## コード

- [ソースコード](../src/app/examples/pizza-order.ts)
- [テスト](../src/app/examples/pizza-order.spec.ts)
