# Book Review

## 概要

星5段階評価のカスタムコントロール（`StarRating`）を含む書籍レビューフォーム。`FormValueControl<number>` インターフェースの実装方法と、カスタムコントロールを Signal Forms に統合するパターンを学ぶ。

## 学習ポイント

- `FormValueControl<T>` インターフェースによるカスタムフォームコントロールの実装
- `model()` を使った双方向バインディング
- カスタムコントロールへの `[formField]` ディレクティブ適用
- `validate()` によるカスタムバリデーション（数値の最小値チェック）
- `maxLength` バリデータの使用

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `rating` | `number` | カスタム（1以上必須） |
| `comment` | `string` | `required`, `maxLength(500)` |

## 実装の要点

### カスタムコントロール（StarRating）

Signal Forms でカスタムコントロールを作るには、`FormValueControl<T>` インターフェースを実装する。核心は `model()` による `value` プロパティの公開。

```typescript
export class StarRating implements FormValueControl<number> {
  // model() で value を公開。FormField ディレクティブがこれを検出し双方向バインドする
  readonly value = model(0);
}
```

`FormValueControl<T>` の要件:

- `value` プロパティを `model()` で宣言する（`ModelSignal<T>` 型）
- `[formField]` ディレクティブがこのシグナルを通じてフォームモデルとカスタムコントロールの値を自動同期する

StarRating コンポーネントは `role="radiogroup"` と `role="radio"` で適切なARIA属性を設定し、キーボード操作（矢印キー、Home/End）にも対応している。

### フォーム定義

`rating` は `number` 型のため `required` バリデータが使えない（空文字列チェックのため）。`validate()` で独自の必須チェックを実装する。

```typescript
readonly reviewForm = form(this.reviewModel, (schema) => {
  // 数値フィールドの必須チェック: 0は未選択として扱う
  validate(schema.rating, ({ value }) => {
    if (value() < 1) {
      return { kind: 'required', message: 'Please select a rating' };
    }
    return undefined;
  });

  required(schema.comment, { message: 'Comment is required' });
  maxLength(schema.comment, 500, { message: 'Comment must be 500 characters or less' });
});
```

### テンプレート

カスタムコントロールも `[formField]` ディレクティブで通常の入力要素と同じように接続できる。

```html
<!-- カスタムコントロールに [formField] を適用 -->
<app-star-rating [formField]="reviewForm.rating" />
```

コメントフィールドでは `textarea` に `[formField]` を適用し、文字数カウントをリアクティブに表示する。

```html
<p>{{ reviewForm.comment().value().length }} / 500</p>
```

### 送信処理

`submit()` + `focusBoundControl()` パターンを使用。ただし `StarRating` は `focusBoundControl()` に直接対応していないため、DOM操作でフォーカスを移動している。

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.reviewForm, async () => {
    // 送信時点のスナップショットを保存
    this.submittedValue.set({ ...this.reviewModel() });
  });

  // StarRating は focusBoundControl() 未対応のため手動フォーカス
  if (this.reviewForm.rating().invalid()) {
    const firstStar = document.querySelector('app-star-rating button');
    if (firstStar instanceof HTMLElement) {
      firstStar.focus();
    }
  } else if (this.reviewForm.comment().invalid()) {
    this.reviewForm.comment().focusBoundControl();
  }
}
```

送信成功時は `submittedValue` シグナルにモデルのスナップショットを保存する。ライブのモデル値ではなくスナップショットを保存するのは、送信後にフォームが編集されても表示が変わらないようにするため。

## コード

- [ソースコード](./book-review.ts)
- [テスト](./book-review.spec.ts)
