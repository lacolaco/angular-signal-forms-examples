# Comment Post

## 概要

非同期フォーム送信中の UI フィードバックを示すコメント投稿フォーム。`form()` の `submission` オプションで送信アクションを宣言的に定義し、`form().submitting()` シグナルでボタンの無効化とラベル切り替えを行う。

## 学習ポイント

- `form()` の `submission: { action }` オプションによる送信アクションの宣言的定義
- `form().submitting()` シグナルによる送信中状態の取得
- `submitting()` を使ったボタンの無効化とラベル切り替え

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `nickname` | `string` | `required` |
| `comment` | `string` | `required` |

## 実装の要点

### submission オプションによる送信アクションの定義

`form()` の第3引数に `submission: { action }` を渡すと、`submit()` 呼び出し時にフォームが valid ならこのアクションが実行される。送信ロジックをフォーム定義と一体で宣言できる。

`action` コールバックの第1引数 `field` はフォームの `FieldTree` で、`field().value()` で送信時点のフォーム値を取得できる。モデルシグナルを直接参照する必要がない。

```typescript
readonly commentForm = form(
  this.commentModel,
  (schema) => {
    required(schema.nickname, { message: 'ニックネームは必須です' });
    required(schema.comment, { message: 'コメントは必須です' });
  },
  {
    submission: {
      action: async (field) => {
        const value = field().value();
        await firstValueFrom(this.http.post('/api/comments', value));
        this.submittedValue.set({ ...value });
      },
    },
  },
);
```

テンプレートでは `submit()` にフォームだけを渡す。アクションは `submission` オプションで定義済みなので第2引数は不要。

```html
<form novalidate (submit)="submit(commentForm); $event.preventDefault()">
```

### submitting() シグナルによる UI 制御

`form().submitting()` はフォーム全体の送信中状態を表すシグナルで、`submission.action` の実行中に `true` になる。テンプレートで直接参照してボタンの `disabled` 属性とラベルテキストを切り替える。

```html
<app-button type="submit" [disabled]="commentForm().submitting()">
  {{ commentForm().submitting() ? '投稿中...' : '投稿する' }}
</app-button>
```

`submitting()` はシグナルなので、値が変わるとテンプレートが自動で再評価される。`subscribe` や手動の変更検知は不要。

## コード

- [ソースコード](./comment-post.ts)
- [テスト](./comment-post.spec.ts)
