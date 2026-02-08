# Checkout

## 概要

カード決済フォームのサンプル。有効期限フィールドを `FormValueControl<string>` によるカスタムコントロールとして実装し、UI とモデルの分離パターンを示す。

## 学習ポイント

- `FormValueControl<T>`: カスタムフォームコントロールのインターフェース実装
- `linkedSignal()`: 外部シグナルと内部状態の同期（`effect()` 不要）
- `model()`: 双方向バインディング用シグナル
- カスタムコントロールでの `focus()` メソッド実装と `focusBoundControl()` 連携

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `cardNumber` | `string` | 必須 |
| `expiryDate` | `string`（`"MM/YY"` 形式） | 必須 |
| `securityCode` | `string` | 必須 |
| `cardholderName` | `string` | 必須 |

## 実装の要点

### カスタムコントロール（ExpiryDateInput）

`FormValueControl<string>` を実装したカスタムコントロール。UI では月(MM)と年(YY)を別々の入力フィールドで受け取るが、フォームモデルには `"MM/YY"` の単一文字列として公開する。

#### FormValueControl インターフェース

`model()` シグナルを `value` プロパティとして公開するだけで実装が完了する。`[formField]` ディレクティブが自動的にバインディングを行う。

```typescript
export class ExpiryDateInput implements FormValueControl<string> {
  // FormValueControl の value プロパティ
  readonly value = model('');
}
```

#### linkedSignal() による内部状態の同期

`linkedSignal()` で外部から渡される `value` シグナルの変更を内部状態（`month`, `year`）に同期する。`effect()` + `signal()` のパターンを置き換える宣言的なアプローチ。

```typescript
// value の変更に連動して月・年を再計算
protected readonly month = linkedSignal(() => parseMonth(this.value()));
protected readonly year = linkedSignal(() => parseYear(this.value()));
```

`linkedSignal()` の特徴:
- 元のシグナル（`value`）が変更されると自動的に再計算される
- `set()` で直接書き込みも可能（ユーザー入力時）
- `effect()` を使わずに双方向の同期を実現

#### カスタムコントロールのフォーカス制御

`focus()` メソッドを実装すると、`focusBoundControl()` から自動的に呼び出される。`viewChild.required()` でテンプレート参照を取得し、フォーカス先を指定する。

```typescript
private readonly monthInput = viewChild.required<ElementRef<HTMLInputElement>>('monthInput');

// focusBoundControl() から自動呼び出し
focus(): void {
  this.monthInput().nativeElement.focus();
}
```

### フォーム定義

全フィールドに `required` バリデーションを適用する。カスタムコントロールも通常のフィールドと同様に扱える。

```typescript
readonly checkoutForm = form(this.checkoutModel, (schema) => {
  required(schema.cardNumber, { message: 'Card number is required' });
  required(schema.expiryDate, { message: 'Expiry date is required' });
  required(schema.securityCode, { message: 'Security code is required' });
  required(schema.cardholderName, { message: 'Cardholder name is required' });
});
```

### テンプレート

カスタムコントロールへの `[formField]` バインディングは、通常の `<input>` と同じ記法で行う。

```html
<!-- カスタムコントロールでも [formField] で同様にバインド -->
<app-expiry-date-input [formField]="checkoutForm.expiryDate" />
```

### 送信処理

`submit()` 後、無効なフィールドに `focusBoundControl()` でフォーカスを移動する。カスタムコントロールの場合、内部の `focus()` メソッドが呼び出され、月入力(MM)にフォーカスが移動する。

```typescript
if (this.checkoutForm.expiryDate().invalid()) {
  // ExpiryDateInput.focus() が呼び出され、月入力にフォーカス
  this.checkoutForm.expiryDate().focusBoundControl();
}
```

## コード

- [ソースコード](../src/app/examples/checkout.ts)
- [テスト](../src/app/examples/checkout.spec.ts)
