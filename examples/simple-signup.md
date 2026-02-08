# Simple Signup

## 概要

Signal Forms の基本的な使い方を示すサインアップフォーム。メール・パスワード・確認パスワードの3フィールドで、フォーム定義からバリデーション、送信処理までの一連の流れを学ぶ入門サンプル。

## 学習ポイント

- `form()` 関数によるフォーム作成
- `FormField` ディレクティブによる双方向バインディング
- 組み込みバリデータ (`required`, `email`)
- `validate()` によるカスタムバリデーション（パスワード一致チェック）
- `submit()` によるフォーム送信
- `focusBoundControl()` によるフォーカス制御

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `email` | `string` | `required`, `email` |
| `password` | `string` | `required` |
| `confirmPassword` | `string` | `required`, カスタム（パスワード一致チェック） |

## 実装の要点

### フォーム定義

Signal Forms のフォームは2つの要素で構成される。

1. **フォームモデル**: フォームの値を保持する `WritableSignal`。この型がフォーム全体の型として推論される。

```typescript
// フォームモデル: WritableSignal で値を保持
readonly signupModel = signal({
  email: '',
  password: '',
  confirmPassword: '',
});
```

2. **フォーム定義**: `form()` 関数にモデルとバリデーションスキーマを渡す。

```typescript
// form(モデル, スキーマ定義コールバック)
readonly signupForm = form(this.signupModel, (schema) => {
  // 組み込みバリデータ: message オプションでエラーメッセージを指定
  required(schema.email, { message: 'Email is required' });
  email(schema.email, { message: 'Please enter a valid email' });
  required(schema.password, { message: 'Password is required' });
  required(schema.confirmPassword, { message: 'Please confirm your password' });

  // カスタムバリデータ: validate() 関数
  // value() で自フィールドの値、valueOf() で他フィールドの値を取得
  validate(schema.confirmPassword, ({ value, valueOf }) => {
    if (value() !== valueOf(schema.password)) {
      // エラー: { kind, message } を返す
      return { kind: 'passwordMismatch', message: 'Passwords do not match' };
    }
    // 成功: undefined を返す
    return undefined;
  });
});
```

`validate()` のコールバックで受け取る `valueOf()` は他フィールドの値をリアクティブに追跡する。パスワードフィールドの値が変わると、確認パスワードのバリデーションも自動で再実行される。

### テンプレート

`[formField]` ディレクティブで入力要素とフォームフィールドを双方向バインドする。

```html
<!-- [formField] で input 要素とフィールドツリーを接続 -->
<input
  type="email"
  [formField]="signupForm.email"
  [aria-invalid]="signupForm.email().touched() && signupForm.email().invalid()"
/>
```

- `signupForm.email`: フィールドツリーへの参照。`[formField]` に渡す
- `signupForm.email()`: フィールドの状態（`FieldState`）を取得する関数呼び出し
- `signupForm.email().touched()`: タッチ済みかどうかのシグナル
- `signupForm.email().invalid()`: バリデーション失敗かどうかのシグナル

`novalidate` 属性でブラウザのネイティブバリデーションを無効化し、Signal Forms のバリデーションに統一する。

### 送信処理

`submit()` 関数がフォーム送信の中核。

```typescript
onSubmit(event: Event) {
  event.preventDefault();
  // submit() は全フィールドを touched にし、valid な場合のみコールバックを実行
  submit(this.signupForm, async () => {
    this.submitted.set(true);
  });

  // invalid な最初のフィールドにフォーカスを移動
  const fields = [
    this.signupForm.email,
    this.signupForm.password,
    this.signupForm.confirmPassword,
  ];
  const firstInvalidField = fields.find((field) => field().invalid());
  firstInvalidField?.().focusBoundControl();
}
```

- `submit()`: 全フィールドを `touched` にした上で、フォームが `valid` なら非同期コールバックを実行
- `focusBoundControl()`: フィールドにバインドされたUI要素（`[formField]` で接続された要素）にフォーカスを移動

## コード

- [ソースコード](../src/app/examples/simple-signup.ts)
- [テスト](../src/app/examples/simple-signup.spec.ts)
