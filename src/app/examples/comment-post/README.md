# Comment Post

## 概要

非同期フォーム送信中の UI フィードバックを示すコメント投稿フォーム。`submit()` の非同期アクション実行中に `form().submitting()` シグナルが `true` になる仕組みを利用して、ボタンの無効化とラベル切り替えを行う。

## 学習ポイント

- `form().submitting()` シグナルによる送信中状態の取得
- `submitting()` を使ったボタンの無効化とラベル切り替え
- `submit()` の非同期アクション内での HTTP リクエスト

## フォーム構造

| フィールド | 型 | バリデーション |
|---|---|---|
| `nickname` | `string` | `required` |
| `comment` | `string` | `required` |

## 実装の要点

### 非同期アクション内での HTTP リクエスト

`submit()` の第2引数に渡す非同期コールバック内で `HttpClient` による POST リクエストを実行する。`submit()` はこのコールバックの `Promise` が解決するまで `submitting()` を `true` に保つ。

```typescript
readonly commentForm = form(this.commentModel, (schema) => {
  required(schema.nickname, { message: 'ニックネームは必須です' });
  required(schema.comment, { message: 'コメントは必須です' });
});

onSubmit() {
  submit(this.commentForm, async () => {
    const value = this.commentModel();
    await firstValueFrom(this.http.post('/api/comments', value));
    this.submittedValue.set({ ...value });
  });
}
```

### submitting() シグナルによる UI 制御

`form().submitting()` はフォーム全体の送信中状態を表すシグナルで、`submit()` に渡した非同期コールバックの実行中に `true` になる。テンプレートで直接参照してボタンの `disabled` 属性とラベルテキストを切り替える。

```html
<app-button type="submit" [disabled]="commentForm().submitting()">
  {{ commentForm().submitting() ? '投稿中...' : '投稿する' }}
</app-button>
```

`submitting()` はシグナルなので、値が変わるとテンプレートが自動で再評価される。`subscribe` や手動の変更検知は不要。

## コード

- [ソースコード](./comment-post.ts)
- [テスト](./comment-post.spec.ts)
