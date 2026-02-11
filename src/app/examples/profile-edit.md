# Profile Edit

## 概要

ユーザー名の重複チェックをバックエンドAPIに問い合わせる非同期バリデーションを含むプロフィール編集フォーム。`validateHttp()` による HTTP ベースの非同期バリデーションと `pending()` 状態の表示を学ぶ。

## 学習ポイント

- `validateHttp()` による HTTP ベースの非同期バリデーション
- `debounce()` によるモデル更新の遅延（不要なHTTPリクエストの抑制）
- `pending()` シグナルによるバリデーション中状態の表示
- 同期バリデーションと非同期バリデーションの組み合わせ
- `pattern()` による正規表現バリデーション
- フォーム全体の `pending()` 状態を送信ボタンに反映

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `username` | `string` | `required`, `minLength(3)`, `maxLength(20)`, `pattern(/^[a-zA-Z0-9_]+$/)`, `debounce(300)`, `validateHttp`（重複チェック） |
| `displayName` | `string` | `required`, `maxLength(50)` |
| `bio` | `string` | `maxLength(200)` |

## 実装の要点

### フォーム定義

`username` フィールドに同期バリデーションと非同期バリデーションの両方を設定する。

```typescript
readonly profileForm = form(this.profileModel, (schema) => {
  // 同期バリデーション（先に実行される）
  required(schema.username, { message: 'Username is required' });
  minLength(schema.username, 3, { message: 'Username must be at least 3 characters' });
  maxLength(schema.username, 20, { message: 'Username must be at most 20 characters' });
  pattern(schema.username, /^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain alphanumeric characters and underscores',
  });

  // 非同期バリデーション: 同期バリデーションがすべてパスした後にのみ実行
  validateHttp(schema.username, {
    // request: バリデーション対象の値からリクエストURLを生成
    request: ({ value }) => {
      const params = new URLSearchParams({ username: value() });
      return `/api/check-username?${params}`;
    },
    // onSuccess: HTTPレスポンスからバリデーション結果を返す
    onSuccess: (response: { taken: boolean }) => {
      if (response.taken) {
        return { kind: 'usernameTaken', message: 'This username is already taken' };
      }
      return null;
    },
    // onError: ネットワークエラー時のフォールバック
    onError: () => ({
      kind: 'networkError',
      message: 'Could not verify username availability',
    }),
  });
});
```

`validateHttp()` の重要な特性:

- **同期バリデーション優先**: 同期バリデーションがすべてパスした場合にのみHTTPリクエストを送信する。不正な入力値でAPIコールが発生しない
- **`request`**: フィールドの値からリクエストURLを生成する関数。値が変わるたびに自動で再リクエスト
- **`onSuccess`**: レスポンスを受け取り、エラーオブジェクトまたは `null`（成功）を返す
- **`onError`**: ネットワークエラー時のハンドリング

### テンプレート

`pending()` シグナルでバリデーション中の状態を表示する。

```html
<!-- フィールドレベル: バリデーション中のインジケーター -->
@if (profileForm.username().pending()) {
  <span aria-live="polite">Checking...</span>
}

<!-- バリデーション成功時のフィードバック -->
@if (usernameAvailable()) {
  <p class="text-green-600">{{ profileForm.username().value() }} is available</p>
}
```

`usernameAvailable` は `pending` でも `invalid` でもない状態を表す computed シグナル。

```typescript
readonly usernameAvailable = computed(() => {
  const state = this.profileForm.username();
  return !state.pending() && state.valid();
});
```

フォーム全体の `pending()` 状態を送信ボタンの `loading` プロパティに反映し、非同期バリデーション中の送信を視覚的に抑制する。

```html
<app-button type="submit" [loading]="profileForm().pending()"> Save Profile </app-button>
```

### 送信処理

`submit()` + `focusBoundControl()` パターン。各フィールドを順にチェックし、最初の invalid フィールドにフォーカスする。

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  submit(this.profileForm, async () => {
    this.submittedValue.set({ ...this.profileModel() });
  });

  if (this.profileForm.username().invalid()) {
    this.profileForm.username().focusBoundControl();
  } else if (this.profileForm.displayName().invalid()) {
    this.profileForm.displayName().focusBoundControl();
  } else if (this.profileForm.bio().invalid()) {
    this.profileForm.bio().focusBoundControl();
  }
}
```

## コード

- [ソースコード](./profile-edit.ts)
- [テスト](./profile-edit.spec.ts)
