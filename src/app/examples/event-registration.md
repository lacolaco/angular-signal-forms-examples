# Event Registration

## 概要

参加者を動的に追加・削除できる、配列フォームのサンプル。`applyEach()` で配列要素に共通のバリデーションを適用する。

## 学習ポイント

- `applyEach()`: 配列の各要素に共通バリデーションを一括適用
- `schema.items[index]`: 配列要素への動的フォームフィールドバインディング
- `signal.update()` による配列要素の追加・削除
- `@for` + `$index` による配列要素の動的レンダリング

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `participants` | `string[]` | 各要素が必須（空文字不可） |

## 実装の要点

### フォーム定義

`applyEach()` で配列の各要素に同一のバリデーションを適用する。配列の長さが変化しても、全要素に自動的にバリデーションが適用される。

```typescript
readonly registrationForm = form(this.registrationModel, (schema) => {
  applyEach(schema.participants, (participant) => {
    required(participant, { message: '参加者名を入力してください' });
  });
});
```

### テンプレート

`@for` でモデルの配列をイテレーションし、`$index` を使って `schema.items[index]` からフォームフィールドを取得する。

```html
@for (participant of registrationModel().participants; track $index) {
  @let field = registrationForm.participants[$index];
  <input
    [formField]="field"
    [aria-invalid]="field().touched() && field().invalid()"
  />
}
```

ポイント:
- `@let field = registrationForm.participants[$index]` でフォームフィールドをローカル変数に束縛
- `field` はシグナルなので、テンプレート内で `field()` で状態を読み取る
- `[formField]="field"` でディレクティブにバインド（`field()` ではなく `field` を渡す）

### 配列操作

モデルシグナルの `update()` で配列を操作する。イミュータブルに更新するのがポイント。

```typescript
// 参加者を追加
addParticipant() {
  this.registrationModel.update((current) => ({
    ...current,
    participants: [...current.participants, ''],
  }));
}

// 参加者を削除
removeParticipant(index: number) {
  this.registrationModel.update((current) => ({
    ...current,
    participants: current.participants.filter((_, i) => i !== index),
  }));
}
```

### エラー表示

配列要素ごとのエラーメッセージは `computed()` でインデックスに基づいて取得する。

```typescript
readonly participantErrors = computed(() => {
  return this.registrationModel().participants.map((_, index) => {
    return fieldErrors(this.registrationForm.participants[index]());
  });
});
```

### 送信処理

`submit()` 後、配列をループして最初の無効なフィールドに `focusBoundControl()` でフォーカスを移動する。

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.registrationForm, async () => {
    this.submittedValue.set({ ...this.registrationModel() });
  });

  // 最初の invalid なフィールドにフォーカス
  const participants = this.registrationModel().participants;
  for (let i = 0; i < participants.length; i++) {
    const field = this.registrationForm.participants[i];
    if (field().invalid()) {
      field().focusBoundControl();
      return;
    }
  }
}
```

## コード

- [ソースコード](./event-registration.ts)
- [テスト](./event-registration.spec.ts)
